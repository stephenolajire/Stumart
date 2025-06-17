import { useEffect } from "react";

const SEO = ({
  title = "StuMart - Campus Marketplace & Delivery Service",
  description = "StuMart connects university students with campus vendors and delivery services. Shop for food, fashion, electronics, books and more with reliable campus delivery.",
  keywords = "campus marketplace, student delivery, university shopping, campus vendors, student commerce, campus food delivery, student marketplace, campus fashion, student shopping platform, university delivery service",
  ogImage = "/path-to-your-logo.png",
}) => {
  useEffect(() => {
    // Update meta tags
    document.title = title;

    const metaTags = {
      description: description,
      keywords: keywords,
      "og:title": title,
      "og:description": description,
      "og:type": "website",
      "og:image": ogImage,
      robots: "index, follow",
      language: "English",
      author: "StuMart",
    };

    // Update existing or create new meta tags
    Object.entries(metaTags).forEach(([name, content]) => {
      let meta =
        document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);

      if (!meta) {
        meta = document.createElement("meta");
        if (name.startsWith("og:")) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", content);
    });

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);

    // Cleanup function
    return () => {
      // Optional: Remove meta tags on component unmount
      // Usually not needed for SEO tags
    };
  }, [title, description, keywords, ogImage]);

  return null; // This component doesn't render anything
};

export default SEO;
