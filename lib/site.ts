const productionSiteUrl = "https://runningshoematch.com";

export function getSiteUrl() {
  const configuredUrl = process.env.NODE_ENV === "production"
    ? productionSiteUrl
    : "http://localhost:3000";

  return configuredUrl.replace(/\/$/, "");
}

export { productionSiteUrl };
