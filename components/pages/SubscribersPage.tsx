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
  Loader2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import Modal from "@/components/Modal";
import { Subscriber, SubscriberFormData } from "@/types/subscriber";
import {
  getSubscribers,
  searchSubscribers,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  getSubscribersCount,
  getAllSubscribers,
  getExistingEmails,
} from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import TopNavbar from "@/components/TopNavbar";

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

  // CSV import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; duplicates: number } | null>(null);

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
      const existing = await searchSubscribers(formData.email);
      const duplicate = existing.find(
        (s) => s.email.toLowerCase() === formData.email.toLowerCase(),
      );
      if (duplicate) {
        showToast("error", "A subscriber with this email already exists");
        return;
      }
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

  const handleDownloadCSV = async () => {
    try {
      const allSubscribers = await getAllSubscribers();
      if (allSubscribers.length === 0) {
        showToast("error", "No subscribers to export");
        return;
      }

      const header = "Email,Status,Subscribed Date";
      const rows = allSubscribers.map((s) => {
        const status = s.subscribed ? "Active" : "Inactive";
        const date = new Date(s.created_at).toISOString().split("T")[0];
        return `"${s.email}","${status}","${date}"`;
      });

      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast("success", `Exported ${allSubscribers.length} subscribers`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showToast("error", "Failed to export subscribers");
    }
  };

  const handleImportCSV = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const emails: { email: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (i === 0 && line.toLowerCase().includes("email")) continue;

        const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        const email = parts.find((p) => p.includes("@"));
        if (email) {
          emails.push({ email: email.toLowerCase() });
        }
      }

      if (emails.length === 0) {
        showToast("error", "No valid emails found in CSV");
        setImporting(false);
        return;
      }

      const existingEmails = await getExistingEmails(emails.map((e) => e.email));
      const newEmails = emails.filter((e) => !existingEmails.has(e.email));

      if (newEmails.length === 0) {
        setImportResult({ added: 0, duplicates: emails.length });
        showToast("info", `All ${emails.length} emails already exist`);
        setImporting(false);
        return;
      }

      const { createSubscribers } = await import("@/supabase/CRUD/queries");
      const result = await createSubscribers(newEmails);
      const totalDuplicates = emails.length - result.added;
      setImportResult({ added: result.added, duplicates: totalDuplicates });
      showToast("success", `Imported ${result.added} subscribers (${totalDuplicates} duplicates skipped)`);
      loadCount();
      loadSubscribers();
    } catch (error) {
      console.error("Error importing CSV:", error);
      showToast("error", "Failed to import subscribers");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="Subscribers"
        icon={<Users className="text-white w-6 h-6" />}
        badge={{ text: `${totalCount} total` }}
        user={user}
      />

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

            <Link href="/campaigns" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Campaigns</span>
            </Link>

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
                <FileText
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>
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
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>

          <button
            onClick={() => {
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>

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

        {/* CSV Import Modal */}
        <Modal
          open={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportResult(null);
          }}
          title="Import Subscribers from CSV"
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file with an <strong>email</strong> column. The first row can be a header.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3182ce] transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-3">Drag and drop or click to select</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportCSV(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#3182ce] file:text-white hover:file:bg-[#2c5282] file:cursor-pointer"
              />
            </div>

            {importing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </div>
            )}

            {importResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>{importResult.added}</strong> subscribers added
                  {importResult.duplicates > 0 && (
                    <>, <strong>{importResult.duplicates}</strong> duplicates skipped</>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportResult(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </Modal>

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
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Subscriber" className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Delete Subscriber
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete &quot;{deletingSubscriber?.email}&quot;? This
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
      </Modal>
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
    <Modal open={isOpen} onClose={onClose} title={subscriber ? "Edit Subscriber" : "Add Subscriber"} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
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
    </Modal>
  );
}
