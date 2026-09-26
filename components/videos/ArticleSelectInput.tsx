"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Link2, Loader2, Search, X } from "lucide-react";
import type { ArticleOption } from "@/types/video";

interface ArticleSelectInputProps {
  /** The stored value: the article's slug, which is what TV links to. */
  value: string;
  onChange: (slug: string) => void;
  /** Shown next to the selected slug so the editor can verify it. */
  selectedLabel?: string | null;
  siteUrl?: string;
}

/**
 * Picks the written companion for a video.
 *
 * Stores the article *slug* because that is what techinika-tv builds its
 * "Read the full story" link from (`${mainAppUrl}/${slug}`), so a title
 * changing later can't break the link.
 *
 * The manual input matters: the search only covers articles, and an editor may
 * be linking something that isn't in the table yet, or working from a slug they
 * already know.
 */
export default function ArticleSelectInput({
  value,
  onChange,
  selectedLabel,
  siteUrl = "https://techinika.com",
}: ArticleSelectInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || manual) return;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/articles/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json().catch(() => ({}));
        setResults(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        console.error("Failed to search articles:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, query ? 300 : 0);
    return () => clearTimeout(handle);
  }, [query, open, manual]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const clear = () => {
    onChange("");
    setQuery("");
    setManual(false);
  };

  if (value && !manual) {
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedLabel || value}
          </p>
          <p className="text-xs text-gray-500 truncate">{value}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={`${siteUrl}/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open the article"
            className="p-1.5 text-gray-400 hover:text-[#3182ce] transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={clear}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear the related article"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-[#3182ce]" />
        <input
          type="text"
          value={manual ? value : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (manual) onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={
            manual ? "Paste the article slug" : "Search articles by title or slug…"
          }
          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 transition-all"
        />
      </div>

      {!manual && (
        <button
          type="button"
          onClick={() => {
            setManual(true);
            setOpen(false);
            setQuery("");
          }}
          className="mt-1 text-xs text-[#3182ce] hover:underline"
        >
          Or paste a slug / link to it manually
        </button>
      )}
      {manual && (
        <button
          type="button"
          onClick={() => {
            setManual(false);
            setQuery("");
          }}
          className="mt-1 text-xs text-gray-500 hover:underline"
        >
          Back to search
        </button>
      )}

      {loading && (
        <div className="absolute left-3 top-[38px] z-20 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
        </div>
      )}

      {!loading && !manual && open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[38px] z-20 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {results.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => {
                onChange(article.slug);
                setQuery("");
                setOpen(false);
              }}
              className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
            >
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{article.slug}</p>
              </div>
              {article.status && article.status !== "published" && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 flex-shrink-0">
                  {article.status}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && !manual && open && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[38px] z-20 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
          No articles found
        </div>
      )}
    </div>
  );
}
