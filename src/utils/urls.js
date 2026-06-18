import { RESTRICTED_URL_PREFIXES } from "./constants.js";

export function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}
