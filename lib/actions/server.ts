"use server"

import { LinkModel } from "@/lib/db/model";
import env from "@/lib/env";
import { generateCode } from "@/lib/utils/shortener";
import { isValidPublicUrl, normalizeUrl, resolvesToSelf } from "@/lib/utils/validations";
import { CACHE_KEY_PREFIX, CACHE_TTL } from "@/lib/constants";
import { redis } from "@/lib/redis";

export interface GetOrCreateShortLinkResponse {
  shortLink: string;
  clicks: number;
}

export const getOrCreateShortLink = async (url: string): Promise<GetOrCreateShortLinkResponse | Error> => {
  url = url.trim();

  if (!isValidPublicUrl(url)) return new Error("Invalid or unsafe URL");

  url = normalizeUrl(url);

  if (await resolvesToSelf(url)) return new Error("URL redirects back to this service");

  const data = await LinkModel.findOne({ url: url });
  if (!!data) return {
    shortLink: `${env.NEXT_PUBLIC_BASE_URL}/${data.code}`,
    clicks: data.clicks
  };

  while (true) {
    try {
      const code = generateCode(8);

      await LinkModel.insertOne({
        code,
        url,
        clicks: 0
      });

      await redis.set(`${CACHE_KEY_PREFIX.link}:${code}`, url, {
        ex: CACHE_TTL.link
      });

      return {
        shortLink: `${env.NEXT_PUBLIC_BASE_URL}/${code}`,
        clicks: 0
      };
    } catch(err: any){
      if (err?.code === 11000) continue; // collision
      return new Error("Internal Server Error");
    }
  }
}

export const getLink = async (code: string) => {
  const data = await LinkModel.findOne({ code });
  if (!data) return null;
  LinkModel.updateOne({ code }, { $inc: { clicks: 1 } }).catch(() => {});
  return data.url;
}