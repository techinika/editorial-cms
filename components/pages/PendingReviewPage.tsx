"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Clock,
  AlertCircle,
} from "lucide-react";
import { JoinedArticle } from "@/types/article";
import { AuthResult } from "@/lib/auth";
import { getArticlesWithPendingFeedbackUser } from "@/supabase/CRUD/querries";
import UserNav from "@/components/UserNav";

interface PendingReviewPageProps {
  user: AuthResult;
}

export default function PendingReviewPage({ user }: PendingReviewPageProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<JoinedArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      if (!user.user?.id) {
        setLoading(false);
        return;
      }
      const result = await getArticlesWithPendingFeedbackUser(user.user.id, user.isAdmin);
      setArticles(result);
    } catch (err) {
      console.error("Error loading articles:", err);
    }
    setLoading(false);
  };

  const filteredArticles = articles.filter((article) =>
    article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArticleClick = (articleId: string) => {
    router.push(`/edit/${articleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Review</h1>
              <p className="text-sm text-gray-500">
                Articles with feedback on your articles
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <UserNav user={user} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No pending reviews
            </h2>
            <p className="text-gray-500">
              All articles have been resolved or there are no articles with feedback yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#3182ce] hover:shadow-md transition-all"
              >
                {article.image ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={article.image || ""}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#3182ce] transition-colors">
                    {article.title || "Untitled"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    {article.author?.image_url ? (
                      <img
                        src={article.author.image_url}
                        alt={article.author.name || "Author"}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                        {(article.author?.name || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{article.author?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">
                      Has unresolved feedback
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
