import React from 'react'
import { getLink } from "@/lib/actions/server";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { withCache } from "@/lib/utils/cache";
import { CACHE_KEY_PREFIX, CACHE_TTL } from "@/lib/constants";

interface PageProps {
  params: Promise<{
    code: string;
  }>
}

export default async function Page({ params }: PageProps) {
  const { code } = await params;

  const link = await withCache(getLink, {
    prefix: CACHE_KEY_PREFIX.link,
    keyResolver: (code) => code,
    ttl: CACHE_TTL.link
  })(code);

  if (!link) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-card/50 border border-border rounded-2xl p-6 sm:p-8 text-center shadow-md">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full bg-muted/30 text-4xl" aria-hidden>
            🔎
          </div>
          <h1 className="text-3xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find a link for that code. It may have expired or never existed.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/" className="btn-primary px-4 py-2 rounded-lg w-full sm:w-auto text-center">Go home</Link>
            <Link href="/" className="btn-outline px-4 py-2 rounded-lg w-full sm:w-auto text-center">Create a new link</Link>
          </div>
        </div>
      </main>
    )
  }

  redirect(link);
}
