import { getLink, preloadPopularLinksToLocalCache } from "@/lib/actions/server";
import { localCache, withLocalCache } from "@/lib/cache";
import { CACHE_LINK_OPTIONS } from "@/lib/constants";

const _getCachedLink = withLocalCache(
  localCache,
  getLink,
  CACHE_LINK_OPTIONS
);

let preloadPromise: Promise<void> | null = null;

export function ensurePreload() {
  if (!preloadPromise) {
    preloadPromise = preloadPopularLinksToLocalCache().catch(() => {});
  }
}

export async function getCachedLink(code: string) {
  "use server";

  ensurePreload();
  return _getCachedLink(code);
}