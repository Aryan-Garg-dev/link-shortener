export const CACHE_KEY_PREFIX = {
  link: "link"
}

export const CACHE_TTL = {
  link: 24 * 60 * 60 * 7
}

export const CACHE_LINK_OPTIONS = {
  prefix: CACHE_KEY_PREFIX.link,
  keyResolver: (code: string) => code,
  ttl: CACHE_TTL.link
}