import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
}

const DEFAULT_KEYWORDS = 'Skyflixer, free movies online, watch movies free, free TV shows, stream movies free, 1080p movies, full HD movies, FHD streaming, watch series online free, free anime streaming, latest movies 2025, trending movies, Hollywood movies free, Bollywood movies online, watch anime free, free movie streaming site, HD movies online, stream TV shows free, new movies online, best free streaming site';

export function SEO({
    title,
    description = 'Watch unlimited movies, TV shows & anime in full 1080p HD — completely free. No signup required. Stream the latest releases, trending titles & classics on Skyflixer.',
    keywords = DEFAULT_KEYWORDS,
    ogTitle,
    ogDescription,
    ogImage = '/og-image.png',
    ogType = 'website',
    canonical,
}: SEOProps) {
    const fullTitle = title ? `${title} | Skyflixer` : 'Skyflixer — Free Movies, TV Shows & Anime in Full HD';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="robots" content="index, follow" />
            <meta name="author" content="Skyflixer" />

            {/* Open Graph */}
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="Skyflixer" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || description} />
            <meta name="twitter:image" content={ogImage} />
            <meta name="twitter:site" content="@Skyflixer" />

            {canonical && <link rel="canonical" href={canonical} />}
        </Helmet>
    );
}
