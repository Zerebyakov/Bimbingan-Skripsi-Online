from fastapi import FastAPI
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv
from typing import List, Optional
import os
import json
import re
import numpy as np

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")
THRESHOLD_PATH = os.getenv("THRESHOLD_PATH")
LEXICON_PATH = os.getenv("LEXICON_PATH", "semantic_lexicon_enriched.csv")

app = FastAPI(title="MiniLM Similarity Service v8")

model = SentenceTransformer(MODEL_PATH)

# ---- konfigurasi ----
threshold_config = {}
try:
    with open(THRESHOLD_PATH, "r", encoding="utf-8") as f:
        threshold_config = json.load(f)
except Exception:
    threshold_config = {}

DEFAULT_THRESHOLD = float(threshold_config.get("threshold", 0.60))
Z_THRESHOLD = float(threshold_config.get("z_threshold", 4.0))
STRONG_THRESHOLD = float(threshold_config.get("strong_threshold", 0.85))
USE_SEMANTIC_NORM = bool(threshold_config.get("use_semantic_norm", False))


# ---- normalisasi lexicon (opsional, identik dgn training v8) ----
def _build_lexicon_map(path):
    if not USE_SEMANTIC_NORM:
        return {}
    if not os.path.exists(path):
        print(f"[lexicon] use_semantic_norm aktif tetapi file tidak ditemukan: {path}")
        return {}
    try:
        import pandas as pd
        lex = pd.read_csv(path)
    except Exception as e:
        print(f"[lexicon] gagal membaca {path}: {e}")
        return {}
    # Toleran terhadap variasi nama kolom hasil ekspor notebook
    src_col = next((c for c in lex.columns if c.lower() in ("source_phrase", "source", "phrase", "variant")), None)
    can_col = next((c for c in lex.columns if c.lower() in ("canonical_phrase", "canonical", "target")), None)
    if not src_col or not can_col:
        print(f"[lexicon] kolom tidak dikenali di {path}: {list(lex.columns)}")
        return {}
    def n(x):
        return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", str(x).lower())).strip()
    mapping = {}
    for _, r in lex.iterrows():
        s, c = n(r[src_col]), n(r[can_col])
        if s and c and s != c:
            mapping[s] = c
    return dict(sorted(mapping.items(), key=lambda kv: -len(kv[0])))


LEXICON_MAP = _build_lexicon_map(LEXICON_PATH)
if USE_SEMANTIC_NORM and not LEXICON_MAP:
    print("[lexicon] PERINGATAN: normalisasi semantik aktif tetapi lexicon kosong — "
          "preprocessing berjalan tanpa substitusi frasa.")


# ---- cache embedding kandidat: hanya encode judul yang belum pernah dilihat ----
EMBED_CACHE_MAX = 20000
_embed_cache = {}


def encode_candidates_cached(clean_titles):
    missing = [t for t in clean_titles if t not in _embed_cache]
    if missing:
        vecs = model.encode(missing, normalize_embeddings=True, batch_size=64)
        if len(_embed_cache) + len(missing) > EMBED_CACHE_MAX:
            _embed_cache.clear()
        for t, v in zip(missing, vecs):
            _embed_cache[t] = np.asarray(v, dtype=np.float32)
    return np.stack([_embed_cache[t] for t in clean_titles])


def preprocess_text(text: str) -> str:
    """Konsisten dengan training: pertahankan - + / dan normalkan tanda hubung."""
    if text is None:
        return ""
    text = text.lower().replace("–", "-").replace("—", "-")
    text = re.sub(r"[^a-z0-9\s\-+/]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not LEXICON_MAP:
        return text
    ph = {}
    for i, (s, c) in enumerate(LEXICON_MAP.items()):
        pat = r"(?<!\w)" + re.escape(s) + r"(?!\w)"
        new = re.sub(pat, f" __S{i}__ ", text)
        if new != text:
            ph[f"__S{i}__"] = c
            text = new
    for k, c in ph.items():
        text = text.replace(k, c)
    return re.sub(r"\s+", " ", text).strip()


def decide_status(sorted_scores, threshold, z_thr=Z_THRESHOLD, strong=STRONG_THRESHOLD):
    """
    Keputusan sadar-latar.
    sorted_scores: list skor terurut menurun.
    Kembalikan (status, info) dan fungsi penanda is_similar per-kandidat.
    """
    s = np.asarray(sorted_scores, dtype=float)
    top = float(s[0]) if len(s) else 0.0
    # latar = jendela pesaing terdekat (rank 2..51), bukan seluruh bank,
    # agar robust saat jumlah kandidat sangat besar.
    bg = s[1:51] if len(s) >= 3 else s
    med = float(np.median(bg)) if len(bg) else top
    mad = float(np.median(np.abs(bg - med))) if len(bg) else 0.0
    robust_z = (top - med) / (1.4826 * mad + 1e-9)

    if top >= strong:
        status = "MIRIP"
    elif top >= threshold and robust_z >= z_thr:
        status = "PERLU_REVIEW"
    else:
        status = "AMAN"

    info = {"max_score": top, "median_latar": med, "robust_z": float(robust_z),
            "z_threshold": z_thr, "threshold": threshold}

    def is_similar(score):
        # kandidat ditandai mirip hanya jika menonjol di atas latar
        z = (float(score) - med) / (1.4826 * mad + 1e-9)
        return bool(float(score) >= strong or (float(score) >= threshold and z >= z_thr))

    return status, info, is_similar


class PairRequest(BaseModel):
    title_1: str
    title_2: str
    threshold: Optional[float] = None


class CandidateTitle(BaseModel):
    id: str
    title: str
    source: Optional[str] = None


class SearchRequest(BaseModel):
    query_title: str
    candidates: List[CandidateTitle]
    top_k: int = Field(default=10, ge=1, le=50)
    threshold: Optional[float] = None


@app.get("/health")
def health_check():
    return {"status": "ok", "model_path": MODEL_PATH, "threshold": DEFAULT_THRESHOLD,
            "z_threshold": Z_THRESHOLD, "strong_threshold": STRONG_THRESHOLD,
            "use_semantic_norm": USE_SEMANTIC_NORM,
            "lexicon_path": LEXICON_PATH, "lexicon_loaded": bool(LEXICON_MAP),
            "lexicon_size": len(LEXICON_MAP), "embed_cache_size": len(_embed_cache)}


@app.post("/similarity/pair")
def similarity_pair(payload: PairRequest):
    threshold = payload.threshold if payload.threshold is not None else DEFAULT_THRESHOLD
    t1 = preprocess_text(payload.title_1)
    t2 = preprocess_text(payload.title_2)
    e1 = model.encode(t1, convert_to_tensor=True, normalize_embeddings=True)
    e2 = model.encode(t2, convert_to_tensor=True, normalize_embeddings=True)
    score = float(util.cos_sim(e1, e2).item())
    pred = 1 if score >= threshold else 0
    return {"title_1": payload.title_1, "title_2": payload.title_2,
            "title_1_clean": t1, "title_2_clean": t2,
            "similarity_score": score, "threshold": threshold,
            "prediction": pred, "label": "Mirip" if pred == 1 else "Tidak Mirip"}


@app.post("/similarity/search")
def similarity_search(payload: SearchRequest):
    threshold = payload.threshold if payload.threshold is not None else DEFAULT_THRESHOLD
    query_clean = preprocess_text(payload.query_title)

    candidates = []
    for item in payload.candidates:
        ct = preprocess_text(item.title)
        if ct:
            candidates.append({"id": item.id, "title": item.title,
                               "source": item.source, "clean_title": ct})

    if not candidates:
        return {"query_title": payload.query_title, "query_clean": query_clean,
                "threshold": threshold, "top_k": payload.top_k,
                "total_candidates": 0, "max_score": 0, "robust_z": 0.0,
                "status": "AMAN", "results": []}

    # Query selalu di-encode; kandidat diambil dari cache (embedding sudah dinormalisasi,
    # sehingga cosine similarity = dot product).
    q = np.asarray(model.encode(query_clean, normalize_embeddings=True), dtype=np.float32)
    cemb = encode_candidates_cached([c["clean_title"] for c in candidates])
    scores = cemb @ q

    ranked = sorted(zip(candidates, scores), key=lambda x: float(x[1]), reverse=True)
    sorted_scores = [float(s) for _, s in ranked]
    status, info, is_similar = decide_status(sorted_scores, threshold)

    results = []
    for item, score in ranked[:payload.top_k]:
        score = float(score)
        results.append({"id": item["id"], "title": item["title"], "source": item["source"],
                        "similarity_score": score, "is_similar": is_similar(score)})

    return {"query_title": payload.query_title, "query_clean": query_clean,
            "threshold": threshold, "top_k": payload.top_k,
            "total_candidates": len(candidates),
            "max_score": info["max_score"], "median_latar": info["median_latar"],
            "robust_z": info["robust_z"], "z_threshold": info["z_threshold"],
            "status": status, "results": results}
