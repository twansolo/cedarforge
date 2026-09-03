import { allOffers, siteConfig } from "@/lib/site";

/**
 * JSON-LD graph.
 *
 * Deliberately omits address detail beyond city/region, phone, founding date,
 * headcount, reviews, ratings, and awards: none of that has been supplied.
 *
 * Prices are also omitted. The figures on the page are "starting at" values and
 * ranges whose final number depends on scope, so publishing them as machine
 * readable `Offer` prices would assert a precision the site explicitly does not
 * claim, and would risk a rich-result mismatch. Service names, descriptions, and
 * capability lists are all drawn from copy that appears on the page.
 */
export function buildStructuredData() {
  const organizationId = `${siteConfig.url}/#organization`;
  const areaServed = {
    "@type": "AdministrativeArea",
    name: `${siteConfig.locality}, ${siteConfig.regionName}`,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        legalName: siteConfig.legalName,
        url: siteConfig.url,
        slogan: siteConfig.tagline,
        description: siteConfig.description,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/Cedar-Forge-Icon-512.png`,
          width: 512,
          height: 512,
        },
        image: `${siteConfig.url}${siteConfig.socialCard}`,
        knowsAbout: [
          "AI workflow automation",
          "Business process automation",
          "Conversion-focused web design",
          "Local SEO",
          "Growth systems for service businesses",
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteConfig.url}/#localbusiness`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        parentOrganization: { "@id": organizationId },
        image: `${siteConfig.url}${siteConfig.socialCard}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.locality,
          addressRegion: siteConfig.region,
          addressCountry: siteConfig.country,
        },
        areaServed,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": organizationId },
        inLanguage: "en-US",
      },
      ...allOffers.map((offer) => ({
        "@type": "Service",
        "@id": `${siteConfig.url}/#service-${offer.id}`,
        name: offer.name,
        description: offer.description,
        serviceType: offer.name,
        provider: { "@id": organizationId },
        areaServed,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${offer.name} scope`,
          itemListElement: offer.includes.map((item) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: item },
          })),
        },
      })),
    ],
  };
}
