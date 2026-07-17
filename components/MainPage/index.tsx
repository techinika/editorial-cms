"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  FileText,
  Search,
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
import { useToast } from "@/components/Toast";
import UserNav from "@/components/UserNav";
import ArticleCard from "./ArticleCard";
import FilterPanel from "./FilterPanel";
import QuickActions from "./QuickActions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import UnpublishModal from "./UnpublishModal";

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

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

  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        <FilterPanel
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          onClearFilters={clearFilters}
        />

        <QuickActions user={user} />

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

      {showDeleteModal && deletingArticle && (
        <DeleteConfirmModal
          article={deletingArticle}
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingArticle(null);
          }}
        />
      )}

      {showUnpublishModal && unpublishArticle && (
        <UnpublishModal
          article={unpublishArticle}
          feedback={unpublishFeedback}
          setFeedback={setUnpublishFeedback}
          loading={unpublishLoading}
          onConfirm={confirmUnpublish}
          onCancel={() => {
            setShowUnpublishModal(false);
            setUnpublishArticle(null);
          }}
        />
      )}
    </div>
  );
}
