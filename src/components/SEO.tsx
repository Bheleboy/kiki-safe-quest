import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/data/routes";

type SEOProps = {
  title: string;
  description: string;
  /** Path such as "/courses/internet-safety". Omit for pages that should not be indexed. */
  path?: string;
  noindex?: boolean;
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/** Per-page title, description, canonical, social preview and structured data. */
const SEO = ({ title, description, path, noindex, image = DEFAULT_IMAGE, imageAlt = "Kiki Warrior, the online safety hero for kids", jsonLd }: SEOProps) => {
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const url = path ? `${SITE_URL}${path}` : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : null}
      {url && !noindex ? <link rel="canonical" href={url} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
