"use client";

import React from "react";
import useCopyToClipboard from "@/hooks/use-clipboard";
import { CopyIcon, CheckIcon } from "lucide-react";

const CopyToClipboard = ({ text, className }: { text: string, className?: string }) => {
  const { isCopied, copy: copyToClipboard } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => !isCopied && copyToClipboard(text)}
      aria-label="Copy to clipboard"
      className={`inline-flex items-center justify-center ${className}`}
    >
      {isCopied ? (
        <CheckIcon className="h-5 w-5 text-zinc-300" />
      ) : (
        <CopyIcon className="h-5 w-5 text-zinc-300 hover:text-zinc-200 transition-colors" />
      )}
    </button>
  );
};

export default CopyToClipboard;