/**
 * Utility to make random image placeholder URLs (like LoremFlickr) deterministic.
 * This ensures the same product always shows the same image in normal and zoom views.
 */
export function getDeterministicImage(url: string, seed: string): string {
  if (!url) return "";
  
  // If it's a placeholder service like LoremFlickr, ensure we use a lock/seed
  if (url.includes("loremflickr.com")) {
    // If it already has a lock, keep it. Otherwise, add one based on the seed.
    if (!url.includes("lock=")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}lock=${seed.length * 42}`;
    }
  }
  
  // If it's Picsum Photos, use /seed/X/800/800 format if applicable
  if (url.includes("picsum.photos")) {
     if (!url.includes("/seed/")) {
        return `https://picsum.photos/seed/${seed}/800/800`;
     }
  }

  return url;
}
