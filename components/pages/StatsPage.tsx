"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  LogOut,
  MessageCircle,
  Eye,
  Users,
  BarChart3,
  ArrowLeft,
  Calendar,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { UserStats, getUserStats, getUserContributedArticles, getUserOwnArticles, getAuthorInfo, ContributorArticle, getAllStats } from "@/supabase/CRUD/querries";
import { AuthResult } from "@/lib/auth";
import { JoinedArticle } from "@/types/article";

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
       <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
         <div className="flex items-center gap-4">
           <div className="bg-[#3182ce] p-2 rounded-lg">
             <BarChart3 className="text-white w-6 h-6" />
           </div>
           <h1 className="text-xl font-medium">My Statistics</h1>
         </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.user.user_metadata.full_name || "User"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                {(user.user.user_metadata.full_name || user.user.email || "U").charAt(0).toUpperCase()}
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
          <a
            href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
            className="p-2 text-gray-500 hover:text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors"
            title="Account Settings"
          >
            <LogOut className="w-5 h-5" />
          </a>
        </div>
       </header>

       <section className="mb-6">
         <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
           Quick Actions
         </h2>
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

       <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Member Since */}
            {memberSince && (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Member since {memberSince}</span>
              </div>
            )}

            {/* Stats Cards */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-md border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3182ce]/10 rounded-md">
                      <FileText className="w-5 h-5 text-[#3182ce]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Articles</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.totalArticles || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-md">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Views</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.totalViews?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-md">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Comments</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.totalComments || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-md">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Published</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.publishedArticles || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-md">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cancelled</p>
                      <p className="text-xl font-bold text-gray-900">{stats?.cancelledArticles || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Articles Breakdown */}
            <section className="mb-8">
              <div className="bg-white rounded-md border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">Published: {stats?.publishedArticles || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm text-gray-600">Drafts: {stats?.draftArticles || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-600">Cancelled: {stats?.cancelledArticles || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    {stats?.totalArticles ? (
                      <>
                        <div
                          className="bg-green-500"
                          style={{ width: `${(stats.publishedArticles / stats.totalArticles) * 100}%` }}
                        />
                        <div
                          className="bg-yellow-500"
                          style={{ width: `${(stats.draftArticles / stats.totalArticles) * 100}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${(stats.cancelledArticles / stats.totalArticles) * 100}%` }}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Articles Tabs */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setActiveTab("own")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "own"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  My Articles ({ownArticles.length})
                </button>
                <button
                  onClick={() => setActiveTab("contributed")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "contributed"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Contributed ({contributedArticles.length})
                </button>
              </div>

              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                {activeTab === "own" ? (
                  ownArticles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No articles yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ownArticles.map((article) => (
                          <tr key={article.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <span className="font-medium text-gray-900">
                                {article.title}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-sm text-gray-600">
                                {article.category?.name || "-"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                article.status === "published"
                                  ? "bg-green-100 text-green-700"
                                  : article.status === "draft"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : article.status === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}>
                                {article.status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-sm text-gray-600">
                                {article.views?.toLocaleString() || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : contributedArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No contributed articles</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contributedArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-900">
                              {article.title}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-600">
                              {article.author?.name || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              article.status === "published"
                                ? "bg-green-100 text-green-700"
                                : article.status === "draft"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : article.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}>
                              {article.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-600">
                              {article.views?.toLocaleString() || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}