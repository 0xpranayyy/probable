import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboard"],
    },
    sitemap: "https://probable.so/sitemap.xml",
  };
}
