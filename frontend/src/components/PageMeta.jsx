import { useEffect } from "react";

/**
 * PageMeta Component
 * Komponen reusable untuk mengatur document title dan meta tags tanpa refresh
 * 
 * @param {string} title - Judul halaman
 * @param {string} description - Deskripsi halaman untuk meta description
 * @param {string} keywords - Keywords untuk SEO (opsional)
 * @param {string} siteName - Nama website (default: "Sistem Bimbingan Online")
 * @param {boolean} appendSiteName - Apakah menambahkan site name di belakang title (default: true)
 */
const PageMeta = ({
    title,
    description = "Sistem Bimbingan Online - Platform kolaborasi mahasiswa dan dosen",
    keywords = "",
    siteName = "BimbinganOS",
    appendSiteName = true
}) => {
    useEffect(() => {
        // Set document title
        const fullTitle = appendSiteName && title
            ? `${title} - ${siteName}`
            : title || siteName;

        document.title = fullTitle;

        // Set atau update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = description;

        // Set atau update meta keywords (jika ada)
        if (keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement("meta");
                metaKeywords.name = "keywords";
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = keywords;
        }

        // Set Open Graph tags untuk social media sharing
        updateMetaTag("og:title", fullTitle);
        updateMetaTag("og:description", description);
        updateMetaTag("og:site_name", siteName);

        // Set Twitter Card tags
        updateMetaTag("twitter:title", fullTitle, "name");
        updateMetaTag("twitter:description", description, "name");

        // Cleanup function untuk reset title saat component unmount (opsional)
        return () => {
            // Bisa dikosongkan atau set ke default title
            // document.title = siteName;
        };
    }, [title, description, keywords, siteName, appendSiteName]);

    // Helper function untuk update meta tags
    const updateMetaTag = (property, content, attribute = "property") => {
        let meta = document.querySelector(`meta[${attribute}="${property}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(attribute, property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    };

    return null; // Component ini tidak render apapun
};

export default PageMeta;