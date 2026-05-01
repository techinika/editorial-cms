"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Trash2,
  Edit2,
  Loader2,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  RefreshCw,
  Plus,
  Image,
  BarChart3,
} from "lucide-react";
import {
  getQueries,
  updateQueryFeedback,
  deleteQuery,
} from "@/supabase/CRUD/queries";
import { Query } from "@/types/query";
import { AuthResult, checkAuthStatus } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { supabaseAdminClient } from "@/supabase/supabase";

interface QueriesPageProps {
  user?: AuthResult;
}

export default function QueriesPage({ user: initialUser }: QueriesPageProps) {
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthResult | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuery, setDeletingQuery] = useState<Query | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const auth = await checkAuthStatus();
      setUser(auth);
      if (auth.isAdmin) {
        loadQueries();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQueries();
      setQueries(data);
    } catch (err) {
      console.error("Error loading queries:", err);
      setError("Failed to load queries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.isAdmin) return;

    const channel = supabaseAdminClient
      .channel("queries_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "querries" },
        (payload) => {
          console.log("Realtime update:", payload);
          loadQueries();
        },
      )
      .subscribe();

    return () => {
      supabaseAdminClient.removeChannel(channel);
    };
  }, [user?.isAdmin]);

  const filteredQueries = queries.filter((q: any) => {
    // Filter by status
    if (filter !== "all" && q.feedback !== filter) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.subject?.toLowerCase().includes(query) ||
        q.message.toLowerCase().includes(query) ||
        q.name?.toLowerCase().includes(query) ||
        q.email.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleUpdateFeedback = async (id: number, feedback: string) => {
    setUpdatingId(id);
    try {
      const result = await updateQueryFeedback(id, feedback);
      if (result) {
        setQueries((prev) =>
          prev.map((q) => (q.id === id ? { ...q, feedback } : q)),
        );
        showToast("success", "Status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      showToast("error", "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (query: Query) => {
    setDeletingQuery(query);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuery) return;

    setDeleteLoading(true);
    try {
      const success = await deleteQuery(deletingQuery.id);
      if (success) {
        setQueries((prev) => prev.filter((q) => q.id !== deletingQuery.id));
        showToast("success", "Query deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting query:", error);
      showToast("error", "Failed to delete query");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletingQuery(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You need admin privileges to access this page.
          </p>
          <Link href="/" className="text-[#3182ce] hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="bg-[#3182ce] p-2 rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <FileText className="text-white w-6 h-6" />
          </Link>
          <h1 className="text-xl font-medium">Contact Queries</h1>
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
                <AlertCircle className="w-5 h-5" />
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
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </Link>

            <Link href="/assets" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>

            <Link href="/stats" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <BarChart3
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Stats</span>
            </Link>
          </div>
        </section>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 justify-between flex-wrap mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "all"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              All ({queries.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "pending"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending ({queries.filter((q) => q.feedback === "pending").length})
            </button>
            <button
              onClick={() => setFilter("replied")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "replied"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Replied ({queries.filter((q) => q.feedback === "replied").length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group w-48">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
              />
            </div>
            <button
              onClick={loadQueries}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Queries List */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Queries ({filteredQueries.length})
          </h2>

          {loading && queries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No queries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#3182ce] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {query.subject || "No Subject"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            query.feedback === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {query.feedback}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {query.name || "Anonymous"} ({query.email})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(
                            query.created_at,
                          ).toLocaleDateString()} at{" "}
                          {new Date(query.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() =>
                          handleUpdateFeedback(
                            query.id,
                            query.feedback === "pending"
                              ? "replied"
                              : "pending",
                          )
                        }
                        disabled={updatingId === query.id}
                        className={`p-1.5 rounded-md transition-colors ${
                          query.feedback === "pending"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        } disabled:opacity-50`}
                        title={
                          query.feedback === "pending"
                            ? "Mark as Resolved"
                            : "Mark as Pending"
                        }
                      >
                        {updatingId === query.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : query.feedback === "pending" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(query)}
                        className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {query.message}
                    </p>
                  </div>
                </div>
              ))}
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
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Query
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this query from "
              {deletingQuery?.name || "Anonymous"}"? This action cannot be
              undone.
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
