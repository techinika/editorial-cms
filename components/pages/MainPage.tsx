"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Users,
  LayoutGrid,
  FileText,
  MoreVertical,
  Search,
  LogOut,
  Filter,
  X,
  Tag,
} from "lucide-react";
import { JoinedArticle } from "@/types/article";
import {
  getArticles,
  searchArticles,
  getFilteredArticles,
  getCategories,
} from "@/supabase/CRUD/querries";
import { useRouter } from "next/navigation";
import { AuthResult } from "@/lib/auth";
import { Category } from "@/types/category";
import Link from "next/link";

const CMSDashboard = ({
  initialArticles,
  user,
}: {
  initialArticles: JoinedArticle[];
  user?: AuthResult;
}) => {
  const router = useRouter();
  const [articles, setArticles] = useState<JoinedArticle[]>(initialArticles);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadMore = async () => {
    setLoading(true);
    const newArticles = await getArticles(page, 12);
    setArticles((prev) => [...prev, ...newArticles]);
    setPage((prev) => prev + 1);
    setHasMore(newArticles.length === 12);
    setLoading(false);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setArticles(initialArticles);
        return;
      }
      setSearching(true);
      const results = await searchArticles(query);
      setArticles(results);
      setSearching(false);
    },
    [initialArticles],
  );

  const applyFilters = useCallback(async () => {
    setLoading(true);
    const filter: Parameters<typeof getFilteredArticles>[0] = {};

    if (statusFilter) {
      filter.status = statusFilter as "draft" | "published" | "archived";
    }
    if (categoryFilter) {
      filter.category_id = categoryFilter;
    }

    const results = await getFilteredArticles(filter, 0, 12);
    setArticles(results);
    setHasMore(results.length === 12);
    setPage(1);
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  const clearFilters = useCallback(async () => {
    setStatusFilter("");
    setCategoryFilter("");
    setLoading(true);
    const results = await getArticles(0, 12);
    setArticles(results);
    setHasMore(results.length === 12);
    setPage(1);
    setLoading(false);
  }, []);

  const handleCategoryChange = (catId: string) => {
    setCategoryFilter(catId);
  };

  useEffect(() => {
    if (statusFilter || categoryFilter) {
      applyFilters();
    }
  }, [statusFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#3182ce] p-2 rounded-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-medium">Blog CMS</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.authenticated && user.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.user.user_metadata.full_name || "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                    {(
                      user.user.user_metadata.full_name ||
                      user.user.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium">
                  {user.user.user_metadata.full_name || user.user.email}
                </span>
                {user.isAdmin && (
                  <span className="text-xs text-[#3182ce] bg-[#3182ce]/10 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              <Link
                href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
                className="p-2 text-gray-500 hover:text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors"
                title="Account Settings"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
              className="px-4 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {/* Filter Section */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              showFilters || statusFilter || categoryFilter
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>

          {(statusFilter || categoryFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}

          {(statusFilter || categoryFilter) && (
            <div className="flex items-center gap-2">
              {statusFilter && (
                <span className="px-3 py-1 bg-[#3182ce]/10 text-[#3182ce] text-sm rounded-md">
                  Status: {statusFilter}
                </span>
              )}
              {categoryFilter && (
                <span className="px-3 py-1 bg-[#3182ce]/10 text-[#3182ce] text-sm rounded-md">
                  Category:{" "}
                  {categories.find((c) => c.id === categoryFilter)?.name ||
                    categoryFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <button
              className="group text-left"
              onClick={() => router.push("/create")}
            >
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Create New Article</span>
            </button>

            <Link href="/categories" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Tag className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Categories</span>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="group cursor-pointer">
                <div className="aspect-[3/4] bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
                  {article.image ? (
                    <img
                      src={article.image || ""}
                      alt={article.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent" />
                  {article.status && (
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded ${
                        article.status === "published"
                          ? "bg-green-100 text-green-700"
                          : article.status === "draft"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {article.status}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 truncate w-32 leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#3182ce]" />
                      {article.category?.name || "Uncategorized"}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && !searchQuery && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CMSDashboard;
