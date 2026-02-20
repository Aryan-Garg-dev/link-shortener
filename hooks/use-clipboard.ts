"use client";
import { useCallback, useState } from "react";

type CopyFn = (text: string) => Promise<boolean>;

function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copy: CopyFn = useCallback(async (text) => {
    if (typeof window === "undefined" || !navigator?.clipboard) {
      setIsCopied(false);
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch {
      setIsCopied(false)
      return false;
    }
  }, []);

  return { isCopied, copy };
}

export default useCopyToClipboard;