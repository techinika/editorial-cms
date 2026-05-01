"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Users,
  LayoutGrid,
  FileText,
  Search,
  LogOut,
  Filter,
  X,
  Tag,
  Share2,
  Trash2,
  Edit2,
  EyeOff,
  Check,
  AlertTriangle,
  BarChart3,
  Clock,
  MessageCircle,
  Bell,
  Image,
  User,
} from "lucide-react";
import { JoinedArticle, ArticlePendingActivity } from "@/types/article";
import {
  getArticles,
  getArticlesByStatus,
  searchArticles,
  getFilteredArticles,
  getCategories,
  deleteArticle,
  updateArticle,
  getAllPendingActivity,
} from "@/supabase/CRUD/queries";
import { useRouter } from "next/navigation";
import { AuthResult } from "@/lib/auth";
import { Category } from "@/types/category";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import UserNav from "@/components/UserNav";

interface MainPageProps {
  initialArticles?: JoinedArticle[];
  initialDrafts?: JoinedArticle[];
  initialPublished?: JoinedArticle[];
  user?: AuthResult;
}

export default function MainPage({
  initialArticles = [],
  initialDrafts = [],
  initialPublished = [],
  user,
}: MainPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<JoinedArticle[]>(initialDrafts);
  const [published, setPublished] = useState<JoinedArticle[]>(initialPublished);
  const [pendingActivity, setPendingActivity] = useState<
    Record<string, ArticlePendingActivity>
  >({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<JoinedArticle | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [unpublishArticle, setUnpublishArticle] =
    useState<JoinedArticle | null>(null);
  const [unpublishFeedback, setUnpublishFeedback] = useState("");
  const [unpublishLoading, setUnpublishLoading] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ArticleCard = ({
    article,
    onShare,
    onEdit,
    onUnpublish,
    onDelete,
    copiedId,
    activity,
  }: {
    article: JoinedArticle;
    onShare: (article: JoinedArticle) => void;
    onEdit: (articleId: string) => void;
    onUnpublish: (article: JoinedArticle) => void;
    onDelete: (article: JoinedArticle) => void;
    copiedId: string | null;
    activity?: ArticlePendingActivity;
  }) => {
    const hasActivity =
      activity &&
      (activity.unresolvedFeedback > 0 || activity.unreadComments > 0);
    const totalActivity = activity
      ? activity.unresolvedFeedback + activity.unreadComments
      : 0;

    return (
      <div className="group cursor-pointer">
        <div className="aspect-[3/4] bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
          {article.image || article.thumbnailAsset?.url ? (
            <img
              src={article.thumbnailAsset?.url || article.image || ""}
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

          {/* Pending Activity Badge */}
          {hasActivity && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              <Bell className="w-3 h-3" />
              {totalActivity}
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(article);
                }}
                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                title="Copy link"
              >
                {copiedId === article.id ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(article.id);
                }}
                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {article.status === "published" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpublish(article);
                  }}
                  className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                  title="Unpublish"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(article);
                }}
                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-red-600 shadow-sm"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-900 truncate w-full leading-tight">
            {article.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#3182ce]" />
              {article.category?.name || "Uncategorized"}
            </p>
            {article.author && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="truncate max-w-[80px]">
                  {article.author.name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    loadPendingActivity();
    if (initialDrafts.length === 0) loadDrafts();
    if (initialPublished.length === 0) loadPublished();
  }, []);

  const loadPendingActivity = async () => {
    const activity = await getAllPendingActivity();
    const activityMap: Record<string, ArticlePendingActivity> = {};
    for (const a of activity) {
      activityMap[a.articleId] = a;
    }
    setPendingActivity(activityMap);
  };

  const loadDrafts = async () => {
    setLoading(true);
    const newDrafts = await getArticlesByStatus("draft", 0, 15);
    setDrafts(newDrafts);
    setLoading(false);
  };

  const loadPublished = async () => {
    setLoading(true);
    const newPublished = await getArticlesByStatus("published", 0, 15);
    setPublished(newPublished);
    setLoading(false);
  };

  const loadMore = async () => {
    setLoading(true);
    const newArticles = await getArticles(page, 12);
    setDrafts((prev) => [
      ...prev,
      ...newArticles.filter((a) => a.status === "draft"),
    ]);
    setPublished((prev) => [
      ...prev,
      ...newArticles.filter((a) => a.status === "published"),
    ]);
    setPage((prev) => prev + 1);
    setHasMore(newArticles.length === 12);
    setLoading(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadDrafts();
      loadPublished();
      return;
    }
    setSearching(true);
    const results = await searchArticles(query);
    setDrafts(results.filter((a) => a.status === "draft"));
    setPublished(results.filter((a) => a.status === "published"));
    setSearching(false);
  }, []);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    const filter: Parameters<typeof getFilteredArticles>[0] = {};

    if (statusFilter) {
      filter.status = statusFilter as "draft" | "published" | "cancelled";
    }
    if (categoryFilter) {
      filter.category_id = categoryFilter;
    }

    const results = await getFilteredArticles(filter, 0, 30);
    setDrafts(results.filter((a) => a.status === "draft"));
    setPublished(results.filter((a) => a.status === "published"));
    setHasMore(results.length === 30);
    setPage(1);
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  const clearFilters = useCallback(async () => {
    setStatusFilter("");
    setCategoryFilter("");
    loadDrafts();
    loadPublished();
  }, []);

  const handleCategoryChange = (catId: string) => {
    setCategoryFilter(catId);
  };

  useEffect(() => {
    if (statusFilter || categoryFilter) {
      applyFilters();
    }
  }, [statusFilter, categoryFilter]);

  const handleShare = async (article: JoinedArticle) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_MAIN_APP ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "";
    const url = `${baseUrl}/${article.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(article.id);
      showToast("success", "Link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast("error", "Failed to copy link");
    }
  };

  const handleDeleteClick = (article: JoinedArticle) => {
    setDeletingArticle(article);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingArticle) return;

    setDeleteLoading(true);
    const success = await deleteArticle(deletingArticle.id);
    if (success) {
      setDrafts((prev) => prev.filter((a) => a.id !== deletingArticle.id));
      setPublished((prev) => prev.filter((a) => a.id !== deletingArticle.id));
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingArticle(null);
  };

  const handleUnpublishClick = (article: JoinedArticle) => {
    if (!user || (!user.isAdmin && article.author?.id !== user.user?.id)) {
      showToast("error", "Only the article owner or admin can unpublish");
      return;
    }
    setUnpublishArticle(article);
    setUnpublishFeedback("");
    setShowUnpublishModal(true);
  };

  const confirmUnpublish = async () => {
    if (!unpublishArticle) return;

    setUnpublishLoading(true);
    const result = await updateArticle(unpublishArticle.id, {
      status: "draft",
      feedback: unpublishFeedback || null,
    });

    if (result) {
      setPublished((prev) => prev.filter((a) => a.id !== unpublishArticle.id));
      setDrafts((prev) => [result as unknown as JoinedArticle, ...prev]);
    }

    setUnpublishLoading(false);
    setShowUnpublishModal(false);
    setUnpublishArticle(null);
  };

  const handleEdit = (articleId: string) => {
    router.push(`/edit/${articleId}`);
  };

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
          <UserNav user={user} />
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
                  <option value="cancelled">Cancelled</option>
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

            <Link href="/stats" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <BarChart3
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">My Stats</span>
            </Link>

            <Link href="/comments" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <MessageCircle
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Comments</span>
            </Link>

            <Link href="/pending" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Clock className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Pending Review</span>
            </Link>

            <Link href="/assets" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>

            {user?.isAdmin && (
              <Link href="/ads" className="group text-left">
                <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                  <Image
                    className="w-12 h-12 text-[#3182ce]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium">Ads</span>
              </Link>
            )}

            {user?.isAdmin && (
              <Link href="/subscribers" className="group text-left">
                <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                  <FileText
                    className="w-12 h-12 text-[#3182ce]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium">Subscribers</span>
              </Link>
            )}

            {user?.isAdmin && (
              <Link href="/campaigns" className="group text-left">
                <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                  <FileText
                    className="w-12 h-12 text-[#3182ce]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium">Campaigns</span>
              </Link>
            )}

            {user?.isAdmin && (
              <Link href="/authors" className="group text-left">
                <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                  <User
                    className="w-12 h-12 text-[#3182ce]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium">Authors</span>
              </Link>
            )}

            {user?.isAdmin && (
              <Link href="/queries" className="group text-left">
                <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                  <MessageCircle className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">Queries</span>
             </Link>
            )}

            <Link href="/bytes" className="group text-left">
              <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Quick Bytes</span>
            </Link>
          </div>
        </section>

        <section>
          {drafts.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Drafts ({drafts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {drafts.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onShare={handleShare}
                    onEdit={handleEdit}
                    onUnpublish={handleUnpublishClick}
                    onDelete={handleDeleteClick}
                    copiedId={copiedId}
                    activity={pendingActivity[article.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {published.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Published ({published.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {published.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onShare={handleShare}
                    onEdit={handleEdit}
                    onUnpublish={handleUnpublishClick}
                    onDelete={handleDeleteClick}
                    copiedId={copiedId}
                    activity={pendingActivity[article.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {drafts.length === 0 && published.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No articles found</p>
            </div>
          )}

          {loading && (
            <div className="mt-8 flex justify-center">
              <span className="text-gray-500">Loading...</span>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Article
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingArticle?.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Modal */}
      {showUnpublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUnpublishModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <EyeOff className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Unpublish Article
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to unpublish "{unpublishArticle?.title}"? It
              will be moved back to draft status.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for unpublishing (optional)
              </label>
              <textarea
                value={unpublishFeedback}
                onChange={(e) => setUnpublishFeedback(e.target.value)}
                placeholder="Why is this being unpublished?"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUnpublishModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnpublish}
                disabled={unpublishLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {unpublishLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
