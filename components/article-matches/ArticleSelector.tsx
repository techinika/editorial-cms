"use client";

import React, { useState, useEffect } from "react";
import { Search, FileText, Loader2, X } from "lucide-react";
import { getAllArticles } from "@/supabase/CRUD/queries";

interface SelectedArticle {
  id: string;
  title: string;
  slug: string;
}

interface ArticleSelectorProps {
  value: SelectedArticle | null;
  onChange: (article: SelectedArticle | null) => void;
}

export default function ArticleSelector({ value, onChange }: ArticleSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await getAllArticles(query.trim() || undefined, 50);
      setResults(data);
      setLoading(false);
    }, query ? 300 : 0);
    return () => clearTimeout(handle);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <FileText className="w-5 h-5 text-[#3182ce] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{value.title}</p>
          <p className="text-xs text-gray-500 truncate">{value.slug}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Change article"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative group mb-2">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-[#3182ce]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles by title..."
          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 transition-all"
        />
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : results.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No articles found</p>
        ) : (
          results.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => onChange(article)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
            >
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
