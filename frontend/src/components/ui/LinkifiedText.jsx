import React from "react";

// Deteksi URL: http(s)://... atau www....
const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_TEST_REGEX = /^(https?:\/\/|www\.)/i;

// Render teks biasa dengan URL yang bisa diklik (dipakai di bubble chat)
const LinkifiedText = ({ text, className = "" }) => {
  if (!text) return null;
  const parts = String(text).split(URL_SPLIT_REGEX);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        URL_TEST_REGEX.test(part) ? (
          <a
            key={i}
            href={part.toLowerCase().startsWith("http") ? part : `https://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
};

export default LinkifiedText;
