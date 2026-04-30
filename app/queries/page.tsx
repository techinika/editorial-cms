"use client";

import { useState, useEffect } from "react";
import { getQueries, updateQueryFeedback, deleteQuery } from "@/supabase/CRUD/querries";
import { Query } from "@/types/query";
import { AuthResult } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface QueriesPageProps {
  user?: AuthResult;
}

export default function QueriesPage({ user }: QueriesPageProps) {
  const { showToast } = useToast();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setLoading(true);
    const data = await getQueries();
    setQueries(data);
    setLoading(false);
  };

  const filteredQueries = queries.filter((q) => {
    if (filter === "all") return true;
    return q.feedback === filter;
  });

  const handleUpdateFeedback = async (id: number, feedback: string) => {
    setUpdatingId(id);
    try {
      const result = await updateQueryFeedback(id, feedback);
      if (result) {
        setQueries((prev) =>
          prev.map((q) => (q.id === id ? { ...q, feedback } : q))
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

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const success = await deleteQuery(deletingId);
      if (success) {
        setQueries((prev) => prev.filter((q) => q.id !== deletingId));
        showToast("success", "Query deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting query:", error);
      showToast("error", "Failed to delete query");
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/" className="text-[#3182ce] hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#3182ce] hover:underline">
              ← Back to CMS
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Contact Queries</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.user?.user_metadata?.full_name || "Admin"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({queries.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Pending ({queries.filter((q) => q.feedback === "pending").length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "resolved"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Resolved ({queries.filter((q) => q.feedback === "resolved").length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Queries List */}
        {!loading && filteredQueries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No queries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className="bg-white rounded-lg shadow-sm border p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {query.subject || "No Subject"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      From: {query.name || "Anonymous"} ({query.email})
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(query.created_at).toLocaleDateString()} at{" "}
                      {new Date(query.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      query.feedback === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {query.feedback}
                  </span>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{query.message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  {query.feedback === "pending" ? (
                    <button
                      onClick={() =>
                        handleUpdateFeedback(query.id, "resolved")
                      }
                      disabled={updatingId === query.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      {updatingId === query.id ? "Updating..." : "Mark as Resolved"}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateFeedback(query.id, "pending")
                      }
                      disabled={updatingId === query.id}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium disabled:opacity-50"
                    >
                      {updatingId === query.id ? "Updating..." : "Mark as Pending"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDeletingId(query.id);
                      setShowDeleteModal(true);
                    }}
                    className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete Query</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this query? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
