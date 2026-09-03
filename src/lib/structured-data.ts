import { services, siteConfig } from "@/lib/site";

/**
 * JSON-LD graph. Deliberately omits address, phone, founding date, reviews,
 * and headcount: none of that has been supplied, and inventing it would be
 * both wrong and an SEO liability.
 */
export function buildStructuredData() {
  const organizationId = `${siteConfig.url}/#organization`;

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
        areaServed: {
          "@type": "AdministrativeArea",
          name: `${siteConfig.locality}, ${siteConfig.regionName}`,
        },
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
      ...services.map((service) => ({
        "@type": "Service",
        "@id": `${siteConfig.url}/#service-${service.id}`,
        name: service.name,
        description: service.summary,
        serviceType: service.name,
        provider: { "@id": organizationId },
        areaServed: {
          "@type": "AdministrativeArea",
          name: `${siteConfig.locality}, ${siteConfig.regionName}`,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${service.name} capabilities`,
          itemListElement: service.capabilities.map((capability) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: capability },
          })),
        },
      })),
    ],
  };
}
