"use client"

import React from "react";
import { getOrCreateShortLink, GetOrCreateShortLinkResponse } from "@/lib/actions/server";
import CopyToClipboard from "@/components/copy-to-clipboard";

export default function Home() {
  const [linkData, setLinkData] = React.useState<GetOrCreateShortLinkResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFormSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = (formData.get("url") as string) || "";
    if (url.trim().length === 0) return alert("Please enter a URL");
    try {
      setLoading(true);
      const response = await getOrCreateShortLink(url);
      if (response instanceof Error) {
        alert(response.message);
      } else {
        setLinkData(response);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={"w-full h-full min-h-screen flex flex-col justify-center items-center bg-background p-4 sm:p-6"}>
      <div className={"max-w-3xl w-full p-4 sm:p-6 flex flex-col gap-6"}>
        <div className={"flex flex-col gap-1"}>
          <p className={"text-4xl font-extrabold"}>Link Shortener</p>
          <p className={"text-sm text-muted-foreground"}>Create a short, shareable link and track clicks.</p>
        </div>

        {/* Form: stack on small screens */}
        <form className={"flex flex-col sm:flex-row gap-2 items-stretch w-full"} onSubmit={handleFormSubmit}>
          <input
            name={"url"}
            type={"url"}
            placeholder={"Enter a URL to shorten (e.g. https://example.com)"}
            required={true}
            className={"flex-1 rounded-lg px-3 py-2 border bg-transparent placeholder:text-muted-foreground outline-none w-full"}
            aria-label="URL to shorten"
          />
          <button
            className={"btn-primary py-2 px-4 rounded-lg w-full sm:w-auto"}
            type={"submit"}
            disabled={loading}
          >{loading ? 'Creating…' : 'Create'}</button>
        </form>

        {linkData && (
          <div className={"mt-2 p-4 rounded-2xl border bg-card/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"}>
            <div className={"flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2"}>
              <div className={"flex-1 min-w-0"}>
                <p className={"truncate text-sm font-medium font-mono text-foreground"} title={linkData.shortLink}>{linkData.shortLink}</p>
                <p className={"text-xs text-muted-foreground mt-1"}>Short link created successfully</p>
              </div>

              <div className={"flex items-center gap-2 mt-2 sm:mt-0"}>
                <span className={"inline-flex items-center gap-2 rounded-full bg-muted/20 px-3 py-1 text-sm text-muted-foreground"}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h3m12 0h3M8 12a4 4 0 1 1 8 0" />
                  </svg>
                  <span className={"font-medium text-sm text-foreground"}>{linkData.clicks}</span>
                  <span className={"text-xs text-muted-foreground"}>clicks</span>
                </span>
              </div>
            </div>

            <div className={"flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"}>
              <a
                href={linkData.shortLink}
                target="_blank"
                rel="noreferrer"
                className={"btn-outline px-3 py-2 rounded-md text-sm w-full sm:w-auto text-center"}
              >Open</a>
              <CopyToClipboard text={linkData.shortLink} className={"w-full sm:w-auto shrink-0"} />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
