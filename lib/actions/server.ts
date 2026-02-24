"use server"

import { getLinkModel } from "@/lib/db/model";
import env from "@/lib/env";
import { generateCode } from "@/lib/utils/shortener";
import { isValidPublicUrl, normalizeUrl, resolvesToSelf } from "@/lib/utils/validations";
import { CACHE_KEY_PREFIX, CACHE_LINK_OPTIONS, CACHE_TTL } from "@/lib/constants";
import { redis } from "@/lib/redis";
import { localCache, withCache } from "@/lib/cache";

export interface GetOrCreateShortLinkResponse {
  shortLink: string;
  clicks: number;
}

export const getOrCreateShortLink = async (url: string): Promise<GetOrCreateShortLinkResponse | Error> => {
  const LinkModel = await getLinkModel();

  url = url.trim();

  if (!isValidPublicUrl(url)) return new Error("Invalid or unsafe URL");

  url = normalizeUrl(url);

  if (await resolvesToSelf(url)) return new Error("URL redirects back to this service");

  const data = await LinkModel.findOne({ url: url }, { projection: { code: 1, clicks: 1 } });
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
        clicks: 0,
        createdAt: new Date()
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

export const getLink = withCache(async (code: string) => {
  const LinkModel = await getLinkModel();

  const data = await LinkModel.findOne({ code }, { projection: { url: 1 } });
  if (!data) return null;
  return data.url;
}, CACHE_LINK_OPTIONS);

export const getPopularLinks = async (limit: number)=> {
  const LinkModel = await getLinkModel();
  return LinkModel.find()
    .sort({ clicks: -1 })
    .limit(limit)
    .project({ code: 1, url: 1 })
    .toArray();
}

export const preloadPopularLinksToLocalCache = async () => {
  const popular = await getPopularLinks(1000);

  localCache.preload(
    popular.map(l => ({
      key: `${CACHE_KEY_PREFIX.link}:${l.code}`,
      value: l.url
    }))
  );
}

export const updateClickCount = async (code: string) => {
  const LinkModel = await getLinkModel();

  await LinkModel.updateOne({ code }, { $inc: { clicks: 1 } });
}


export type AnalyticsParams = {
  topLimit?: number;
  from?: Date;
  to?: Date;
};

export const getAnalytics = async (params: AnalyticsParams = {}) => {
  const LinkModel = await getLinkModel();

  const topLimit = Math.min(Math.max(params.topLimit ?? 5, 1), 50);

  const now = new Date();
  const from = params.from ?? new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = params.to ?? now;

  const [result] = await LinkModel.aggregate([
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalLinks: { $sum: 1 },
              totalClicks: { $sum: "$clicks" }
            }
          }
        ],

        todayLinks: [
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $count: "count" }
        ],

        topLinks: [
          { $sort: { clicks: -1 } },
          { $limit: topLimit },
          {
            $project: {
              _id: 0,
              code: 1,
              url: 1,
              clicks: 1,
              createdAt: 1
            }
          }
        ]
      }
    }
  ]).toArray();

  return {
    totalLinks: result?.overview?.[0]?.totalLinks ?? 0,
    totalClicks: result?.overview?.[0]?.totalClicks ?? 0,
    linksInRange: result?.todayLinks?.[0]?.count ?? 0,
    topLinks: result?.topLinks ?? [],
    range: { from, to }
  };

}