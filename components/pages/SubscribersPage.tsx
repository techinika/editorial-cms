"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  FileText,
  Search,
  X,
  Trash2,
  Edit2,
  Mail,
  MailOpen,
  Loader2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Subscriber, SubscriberFormData } from "@/types/subscriber";
import {
  getSubscribers,
  searchSubscribers,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  getActiveSubscribers,
  getSubscribersCount,
} from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface SubscribersPageProps {
  user?: AuthResult;
}

export default function SubscribersPage({ user }: SubscribersPageProps) {
  const { showToast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSubscriber, setDeletingSubscriber] = useState<Subscriber | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadSubscribers();
    loadCount();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const data = await getSubscribers(0, 20);
    setSubscribers(data);
    setHasMore(data.length === 20);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const newSubscribers = await getSubscribers(page, 20);
    setSubscribers((prev) => [...prev, ...newSubscribers]);
    setPage((prev) => prev + 1);
    setHasMore(newSubscribers.length === 20);
    setLoading(false);
  };

  const loadCount = async () => {
    const count = await getSubscribersCount();
    setTotalCount(count);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        loadSubscribers();
        return;
      }
      setSearching(true);
      const results = await searchSubscribers(query);
      setSubscribers(results);
      setSearching(false);
    },
    [],
  );

  const handleSave = async (formData: SubscriberFormData) => {
    if (editingSubscriber) {
      const updated = await updateSubscriber(editingSubscriber.id, formData);
      if (updated) {
        setSubscribers((prev) =>
          prev.map((sub) => (sub.id === updated.id ? updated : sub)),
        );
        showToast("success", "Subscriber updated successfully!");
      }
    } else {
      const created = await createSubscriber(formData);
      if (created) {
        setSubscribers((prev) => [created, ...prev]);
        showToast("success", "Subscriber added successfully!");
        loadCount();
      }
    }
    setShowEditModal(false);
    setEditingSubscriber(null);
  };

  const handleDeleteClick = (subscriber: Subscriber) => {
    setDeletingSubscriber(subscriber);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingSubscriber) return;

    setDeleteLoading(true);
    const success = await deleteSubscriber(deletingSubscriber.id);
    if (success) {
      setSubscribers((prev) => prev.filter((s) => s.id !== deletingSubscriber.id));
      showToast("success", "Subscriber deleted successfully!");
      loadCount();
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingSubscriber(null);
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast("error", "Please fill in both subject and body");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("success", `Email sent to ${result.count} subscribers!`);
        setShowEmailModal(false);
        setEmailSubject("");
        setEmailBody("");
      } else {
        showToast("error", result.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending bulk email:", error);
      showToast("error", "Failed to send emails");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="bg-[#3182ce] p-2 rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <FileText className="text-white w-6 h-6" />
          </Link>
          <h1 className="text-xl font-medium">Subscribers</h1>
          <span className="px-3 py-1 bg-[#3182ce]/10 text-[#3182ce] text-sm font-medium rounded-full">
            {totalCount} total
          </span>
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
                <X className="w-5 h-5" />
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
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => {
                setEditingSubscriber(null);
                setShowEditModal(true);
              }}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Add Subscriber</span>
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Send Bulk Email</span>
            </button>

            <Link href="/campaigns" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Campaigns</span>
            </Link>

            <a href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </a>

            <a href="/assets" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </a>
          </div>
        </section>

        <div className="flex items-center justify-between mb-6">
          <div className="relative group w-48">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingSubscriber(null);
              setShowEditModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Subscriber
          </button>
        </div>

        {/* Edit/Create Modal */}
        {showEditModal && (
          <SubscriberEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingSubscriber(null);
            }}
            subscriber={editingSubscriber}
            onSave={handleSave}
          />
        )}

        {/* Bulk Email Modal */}
        {showEmailModal && (
          <BulkEmailModal
            isOpen={showEmailModal}
            onClose={() => {
              setShowEmailModal(false);
              setEmailSubject("");
              setEmailBody("");
            }}
            onSend={handleSendBulkEmail}
            sending={sendingEmail}
            subject={emailSubject}
            setSubject={setEmailSubject}
            body={emailBody}
            setBody={setEmailBody}
          />
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Subscribers ({subscribers.length})
          </h2>

          {loading && subscribers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No subscribers found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subscribed Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${subscriber.subscribed ? "bg-green-100" : "bg-gray-100"}`}>
                              <Mail className={`w-5 h-5 ${subscriber.subscribed ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {subscriber.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${subscriber.subscribed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {subscriber.subscribed ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(subscriber.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingSubscriber(subscriber);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(subscriber)}
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && !searchQuery && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
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
                Delete Subscriber
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingSubscriber?.email}"? This
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
    </div>
  );
}

// Subscriber Edit Modal Component
function SubscriberEditModal({
  isOpen,
  onClose,
  subscriber,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  onSave: (formData: SubscriberFormData) => void;
}) {
  const [email, setEmail] = useState(subscriber?.email || "");
  const [subscribed, setSubscribed] = useState(subscriber?.subscribed ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ email, subscribed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {subscriber ? "Edit Subscriber" : "Add Subscriber"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              placeholder="subscriber@example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={subscribed}
                onChange={(e) => setSubscribed(e.target.checked)}
                className="w-4 h-4 text-[#3182ce] border-gray-300 rounded focus:ring-[#3182ce]"
              />
              <span className="text-sm text-gray-700">Active Subscriber</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
            >
              {subscriber ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bulk Email Modal Component
function BulkEmailModal({
  isOpen,
  onClose,
  onSend,
  sending,
  subject,
  setSubject,
  body,
  setBody,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
  subject: string;
  setSubject: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Send Bulk Email to All Subscribers
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              placeholder="Email subject..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body *
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
              placeholder="Email body (HTML supported)..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This will send the email to all active subscribers.
              Make sure to review your email before sending.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
