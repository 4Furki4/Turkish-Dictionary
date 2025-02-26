import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Base URL - update this with your production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "turkish-dictionary-chi.vercel.app";

  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/dashboard/*",
        "/panel/",
        "/panel/*",
        "/complete-profile",
        "/profil-tamamla",
      ],
    },
    {
      userAgent: "GPTBot",
      disallow: "/",
    }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
