"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Check,
  CheckCircle,
  Trash2,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  X,
  AlertTriangle,
  Plus,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResult } from "@/lib/auth";
import {
  getAllComments,
  getUserComments,
  markCommentAsRead,
  markAllCommentsAsReadByArticle,
  deleteComment,
} from "@/supabase/CRUD/querries";
import { Comment } from "@/types/article";
import { useToast } from "@/components/Toast";
import UserNav from "@/components/UserNav";

interface CommentsPageProps {
  user?: AuthResult;
}

export default function CommentsPage({ user }: CommentsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = user?.isAdmin || false;

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      let data: Comment[] = [];
      if (isAdmin) {
        data = await getAllComments();
      } else if (user?.user?.id) {
        data = await getUserComments(user.user.id);
      }
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
      showToast("error", "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.user?.id, showToast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      !searchQuery.trim() ||
      comment.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.article?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterUnread || comment.read === false;
    return matchesSearch && matchesFilter;
  });

  const handleMarkAsRead = async (commentId: string) => {
    const success = await markCommentAsRead(commentId);
    if (success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, read: true } : c))
      );
      showToast("success", "Comment marked as read");
    } else {
      showToast("error", "Failed to mark comment as read");
    }
  };

  const handleMarkAllAsRead = async (articleId: string) => {
    const success = await markAllCommentsAsReadByArticle(articleId);
    if (success) {
      setComments((prev) =>
        prev.map((c) =>
          c.article_id === articleId ? { ...c, read: true } : c
        )
      );
      showToast("success", "All comments marked as read");
    } else {
      showToast("error", "Failed to mark comments as read");
    }
  };

  const handleDeleteClick = (comment: Comment) => {
    setDeletingComment(comment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingComment) return;
    setDeleteLoading(true);
    const success = await deleteComment(deletingComment.id);
    if (success) {
      setComments((prev) => prev.filter((c) => c.id !== deletingComment.id));
      showToast("success", "Comment deleted");
    } else {
      showToast("error", "Failed to delete comment");
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingComment(null);
  };

  const unreadCount = comments.filter((c) => c.read === false).length;

  const getUserName = (comment: Comment) => {
    return comment.user?.nickname || "Unknown User";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="bg-[#3182ce] p-2 rounded-lg">
            <MessageCircle className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-medium">Comments</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <UserNav user={user} />
        </div>
      </header>

       <main className="max-w-5xl mx-auto p-8">
         {/* Quick Actions */}
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
         
         {/* Search and Filter */}
         <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            />
          </div>
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              filterUnread
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Unread Only</span>
          </button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No comments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-white border rounded-lg p-4 ${
                  comment.read === false
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium ${
                          comment.read === false
                            ? "text-amber-700"
                            : "text-gray-500"
                        }`}
                      >
                        {getUserName(comment)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {comment.created_at &&
                          new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.read === false && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Unread
                        </span>
                      )}
                    </div>
                    {comment.article && (
                      <Link
                        href={`/edit/${comment.article_id}`}
                        className="text-xs text-[#3182ce] hover:underline mb-2 block truncate"
                      >
                        Re: {comment.article.title}
                      </Link>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {comment.read === false && (
                      <button
                        onClick={() => handleMarkAsRead(comment.id)}
                        className="p-2 text-gray-600 hover:text-[#3182ce] hover:bg-gray-100 rounded-md"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteClick(comment)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Comment
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this comment? This action cannot be
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
    </div>
  );
}