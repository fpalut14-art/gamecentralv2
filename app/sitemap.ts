import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://gamecentral.com",
      lastModified: new Date(),
    },
    {
      url: "https://gamecentral.com/login",
      lastModified: new Date(),
    },
    {
      url: "https://gamecentral.com/register",
      lastModified: new Date(),
    },
    {
      url: "https://gamecentral.com/profile",
      lastModified: new Date(),
    },
    {
      url: "https://gamecentral.com/create",
      lastModified: new Date(),
    },
  ];
}