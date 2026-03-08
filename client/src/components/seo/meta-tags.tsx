import { useEffect } from "react";

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  price?: number;
  currency?: string;
}

export function MetaTags({
  title,
  description,
  image,
  url,
  type = "website",
  price,
  currency = "USD",
}: MetaTagsProps) {
  useEffect(() => {
    const fullTitle = `${title} | Ghani Africa`;
    const siteUrl = url || window.location.href;
    const defaultImage = image || "/og-image.png";

    document.title = fullTitle;

    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let tag = document.querySelector(selector);
      
      if (!tag) {
        tag = document.createElement("meta");
        if (isProperty) {
          tag.setAttribute("property", property);
        } else {
          tag.setAttribute("name", property);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMetaTag("description", description, false);
    
    updateMetaTag("og:title", fullTitle);
    updateMetaTag("og:description", description);
    updateMetaTag("og:image", defaultImage);
    updateMetaTag("og:url", siteUrl);
    updateMetaTag("og:type", type);
    updateMetaTag("og:site_name", "Ghani Africa");

    updateMetaTag("twitter:card", "summary_large_image", false);
    updateMetaTag("twitter:title", fullTitle, false);
    updateMetaTag("twitter:description", description, false);
    updateMetaTag("twitter:image", defaultImage, false);

    if (type === "product" && price) {
      updateMetaTag("product:price:amount", price.toString());
      updateMetaTag("product:price:currency", currency);
    }

    return () => {
      document.title = "Ghani Africa - African Digital Marketplace";
    };
  }, [title, description, image, url, type, price, currency]);

  return null;
}

export function setDefaultMetaTags() {
  const defaultTitle = "Ghani Africa - African Digital Marketplace";
  const defaultDescription = "Connect with businesses, traders, and consumers across Africa. Buy and sell products from Kenya, Nigeria, Ghana, South Africa, and more.";
  
  document.title = defaultTitle;

  const metaTags = [
    { property: "og:title", content: defaultTitle },
    { property: "og:description", content: defaultDescription },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Ghani Africa" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: defaultTitle },
    { name: "twitter:description", content: defaultDescription },
    { name: "description", content: defaultDescription },
    { name: "keywords", content: "Africa, marketplace, e-commerce, buy, sell, trade, Nigeria, Kenya, Ghana, South Africa, African business" },
  ];

  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let tag = document.querySelector(selector);
    
    if (!tag) {
      tag = document.createElement("meta");
      if (property) {
        tag.setAttribute("property", property);
      } else if (name) {
        tag.setAttribute("name", name);
      }
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  });
}
