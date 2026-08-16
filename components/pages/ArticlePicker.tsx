"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X, GripVertical, ExternalLink } from "lucide-react";
import { getArticles } from "@/supabase/CRUD/queries";
import { JoinedArticle } from "@/types/article";

const SITE_URL = "https://techinika.com";

interface SelectedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  image: string | null;
}

interface ArticlePickerProps {
  selected: SelectedArticle[];
  onChange: (articles: SelectedArticle[]) => void;
}

export default function ArticlePicker({ selected, onChange }: ArticlePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [articles, setArticles] = useState<JoinedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen && articles.length === 0) {
      loadArticles();
    }
  }, [isOpen]);

  const loadArticles = async () => {
    setLoading(true);
    const data = await getArticles(0, 50);
    setArticles(data.filter((a) => a.status === "published"));
    setLoading(false);
  };

  const filtered = articles.filter(
    (a) =>
      !selected.some((s) => s.id === a.id) &&
      (a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.summary?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = (article: JoinedArticle) => {
    onChange([
      ...selected,
      {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        image: article.image,
      },
    ]);
    setSearch("");
  };

  const handleRemove = (id: string) => {
    onChange(selected.filter((a) => a.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selected];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= selected.length - 1) return;
    const next = [...selected];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Featured Articles
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Select published articles to include as cards at the bottom of your email.
      </p>

      {selected.length > 0 && (
        <div className="space-y-2 mb-3">
          {selected.map((article, index) => (
            <div
              key={article.id}
              className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md"
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {SITE_URL}/{article.slug}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open(`${SITE_URL}/${article.slug}`, "_blank")}
                className="p-1 text-gray-400 hover:text-[#3182ce]"
                title="Preview"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                &#9650;
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === selected.length - 1}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                &#9660;
              </button>
              <button
                type="button"
                onClick={() => handleRemove(article.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 w-full bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        {isOpen ? "Close article picker" : "Browse published articles"}
      </button>

      {isOpen && (
        <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#3182ce]/20"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading articles...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {articles.length === 0
                  ? "No published articles found"
                  : "All articles already selected"}
              </div>
            ) : (
              filtered.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => handleAdd(article)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {article.title}
                    </p>
                    {article.summary && (
                      <p className="text-xs text-gray-500 truncate">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
