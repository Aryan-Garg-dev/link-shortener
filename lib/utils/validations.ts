import env from "@/lib/env";

const SHORTENER_HOST = new URL(env.NEXT_PUBLIC_BASE_URL).hostname.toLowerCase();

export const isPrivateHost = (hostname: string) => {
  return (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.")
  );
};

export const normalizeUrl = (input: string): string => {
  const parsed = new URL(input);

  parsed.hostname = parsed.hostname.toLowerCase();

  parsed.hash = "";

  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
};

export const isValidPublicUrl = (input: string): boolean => {
  try {
    const parsed = new URL(input);

    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === SHORTENER_HOST) return false;
    return !isPrivateHost(hostname);

  } catch {
    return false;
  }
};

export const resolvesToSelf = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(3000)
    });

    const finalHost = new URL(res.url).hostname.toLowerCase();
    return finalHost === SHORTENER_HOST;
  } catch {
    return false;
  }
};
