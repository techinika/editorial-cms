"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Users,
  BarChart3,
  Calendar,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  UserStats,
  getUserStats,
  getUserContributedArticles,
  getUserOwnArticles,
  getAuthorInfo,
  ContributorArticle,
  getAllStats,
} from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import { JoinedArticle } from "@/types/article";
import PeriodStatsSection from "@/components/Stats/PeriodStatsSection";
import TrendChart from "@/components/Stats/TrendChart";
import { KPICard, EmptyState, StatusBadge } from "@/components/Stats/StatsSubComponents";
import TopNavbar from "@/components/TopNavbar";

interface StatsPageProps {
  user?: AuthResult;
}

export default function StatsPage({ user }: StatsPageProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownArticles, setOwnArticles] = useState<JoinedArticle[]>([]);
  const [contributedArticles, setContributedArticles] = useState<ContributorArticle[]>([]);
  const [activeTab, setActiveTab] = useState<"own" | "contributed">("own");
  const [memberSince, setMemberSince] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user?.id) {
      loadStats(user.user.id);
    }
  }, [user]);

  const loadStats = async (userId: string) => {
    setLoading(true);
    try {
      const isAdmin = user?.isAdmin;
      const [statsData, ownData, contributedData, authorData] = await Promise.all([
        isAdmin ? getAllStats() : getUserStats(userId),
        getUserOwnArticles(userId, 10),
        getUserContributedArticles(userId),
        getAuthorInfo(userId),
      ]);

      setStats(statsData);
      setOwnArticles(ownData);
      setContributedArticles(contributedData);

      if (authorData?.created_at) {
        const date = new Date(authorData.created_at);
        setMemberSince(date.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to view stats</p>
      </div>
    );
  }

  const avgViews = stats?.publishedArticles
    ? Math.round((stats.totalViews || 0) / stats.publishedArticles)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="My Statistics"
        icon={<BarChart3 className="text-white w-6 h-6" />}
        user={user}
      />

      <main className="max-w-7xl mx-auto p-8">
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-6">
            <Link href="/create" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">New Article</span>
            </Link>
            <Link href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {memberSince && (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Member since {memberSince}</span>
              </div>
            )}

            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Lifetime Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard icon={<FileText className="w-5 h-5 text-[#3182ce]" />} bg="bg-[#3182ce]/10" label="Total Published" value={stats?.publishedArticles || 0} />
                <KPICard icon={<Eye className="w-5 h-5 text-green-600" />} bg="bg-green-100" label="Total Views" value={(stats?.totalViews || 0).toLocaleString()} />
                <KPICard icon={<Users className="w-5 h-5 text-purple-600" />} bg="bg-purple-100" label="Total Articles" value={stats?.totalArticles || 0} />
                <KPICard icon={<TrendingUp className="w-5 h-5 text-amber-600" />} bg="bg-amber-100" label="Avg Views/Article" value={avgViews.toLocaleString()} />
              </div>
            </section>

            <TrendChart user={user} />
            <PeriodStatsSection user={user} />

            <section className="mb-8">
              <div className="bg-white rounded-md border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm text-gray-600">Published: {stats?.publishedArticles || 0}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-sm text-gray-600">Drafts: {stats?.draftArticles || 0}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-gray-600">Cancelled: {stats?.cancelledArticles || 0}</span></div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    {stats?.totalArticles ? (
                      <>
                        <div className="bg-green-500" style={{ width: `${(stats.publishedArticles / stats.totalArticles) * 100}%` }} />
                        <div className="bg-yellow-500" style={{ width: `${(stats.draftArticles / stats.totalArticles) * 100}%` }} />
                        <div className="bg-red-500" style={{ width: `${(stats.cancelledArticles / stats.totalArticles) * 100}%` }} />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setActiveTab("own")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "own" ? "bg-[#3182ce] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
                  My Articles ({ownArticles.length})
                </button>
                <button onClick={() => setActiveTab("contributed")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "contributed" ? "bg-[#3182ce] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
                  Contributed ({contributedArticles.length})
                </button>
              </div>

              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                {activeTab === "own" ? (
                  ownArticles.length === 0 ? (
                    <EmptyState icon={<FileText className="w-12 h-12 text-gray-300" />} message="No articles yet" />
                  ) : (
                    <ArticleTable articles={ownArticles} />
                  )
                ) : contributedArticles.length === 0 ? (
                  <EmptyState icon={<Users className="w-12 h-12 text-gray-300" />} message="No contributed articles" />
                ) : (
                  <ContributedArticleTable articles={contributedArticles} />
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ArticleTable({ articles }: { articles: JoinedArticle[] }) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {articles.map((article) => (
          <tr key={article.id} className="hover:bg-gray-50">
            <td className="px-5 py-3"><span className="font-medium text-gray-900">{article.title}</span></td>
            <td className="px-5 py-3"><span className="text-sm text-gray-600">{article.category?.name || "-"}</span></td>
            <td className="px-5 py-3"><StatusBadge status={article.status} /></td>
            <td className="px-5 py-3"><span className="text-sm text-gray-600">{article.views?.toLocaleString() || 0}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ContributedArticleTable({ articles }: { articles: ContributorArticle[] }) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {articles.map((article) => (
          <tr key={article.id} className="hover:bg-gray-50">
            <td className="px-5 py-3"><span className="font-medium text-gray-900">{article.title}</span></td>
            <td className="px-5 py-3"><span className="text-sm text-gray-600">{article.author?.name || "-"}</span></td>
            <td className="px-5 py-3"><StatusBadge status={article.status} /></td>
            <td className="px-5 py-3"><span className="text-sm text-gray-600">{article.views?.toLocaleString() || 0}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
