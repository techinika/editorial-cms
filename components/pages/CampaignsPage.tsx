"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  FileText,
  Search,
  X,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Campaign, CampaignFormData } from "@/types/campaign";
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStats,
  getCampaignsCount,
} from "@/supabase/CRUD/querries";
import { getActiveSubscribers } from "@/supabase/CRUD/querries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { getSubscribersCount } from "@/supabase/CRUD/querries";

interface CampaignsPageProps {
  user?: AuthResult;
}

export default function CampaignsPage({ user }: CampaignsPageProps) {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // New campaign form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  // View campaign modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Send modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState<Campaign | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadCount();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const data = await getCampaigns(0, 20);
    setCampaigns(data);
    setHasMore(data.length === 20);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const newCampaigns = await getCampaigns(page, 20);
    setCampaigns((prev) => [...prev, ...newCampaigns]);
    setPage((prev) => prev + 1);
    setHasMore(newCampaigns.length === 20);
    setLoading(false);
  };

  const loadCount = async () => {
    const count = await getCampaignsCount();
    setTotalCount(count);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        loadCampaigns();
        return;
      }
      // Local filter by subject
      const filtered = campaigns.filter((c) =>
        c.subject.toLowerCase().includes(query.toLowerCase())
      );
      setCampaigns(filtered);
    },
    [campaigns],
  );

  const handleCreateCampaign = async () => {
    if (!newSubject.trim() || !newBody.trim()) {
      showToast("error", "Please fill in both subject and body");
      return;
    }

    const created = await createCampaign({
      subject: newSubject,
      body: newBody,
      status: 'draft',
    });

    if (created) {
      setCampaigns((prev) => [created, ...prev]);
      showToast("success", "Campaign created successfully!");
      setShowCreateModal(false);
      setNewSubject("");
      setNewBody("");
      loadCount();
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingCampaign) return;

    setDeleteLoading(true);
    const success = await deleteCampaign(deletingCampaign.id);
    if (success) {
      setCampaigns((prev) => prev.filter((c) => c.id !== deletingCampaign.id));
      showToast("success", "Campaign deleted successfully!");
      loadCount();
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingCampaign(null);
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    setSendingCampaign(campaign);
    setShowSendModal(true);
  };

  const confirmSend = async () => {
    if (!sendingCampaign) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: sendingCampaign.subject,
          body: sendingCampaign.body,
          campaignId: sendingCampaign.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          "success",
          `Email sent to ${result.count} subscribers (${result.failed} failed)`
        );
        setShowSendModal(false);
        loadCampaigns(); // Reload to get updated stats
      } else {
        showToast("error", result.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      showToast("error", "Failed to send emails");
    } finally {
      setIsSending(false);
      setSendingCampaign(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'sending':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
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
          <h1 className="text-xl font-medium">Email Campaigns</h1>
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
              onClick={() => setShowCreateModal(true)}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Create Campaign</span>
            </button>

            <Link href="/subscribers" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Subscribers</span>
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
          </div>
        </section>

        <div className="flex items-center justify-between mb-6">
          <div className="relative group w-48">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Campaign
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
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
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                    placeholder="Email subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body * (HTML supported)
                  </label>
                  <textarea
                    required
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none font-mono"
                    placeholder="<h1>Your email content here...</h1>"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> You can save as draft and send later, or send immediately after creating.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  className="px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Campaign Modal */}
        {showViewModal && viewingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowViewModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewingCampaign.subject}
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(viewingCampaign.status)}`}>
                    {viewingCampaign.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Recipients</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewingCampaign.total_recipients}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600">Sent</p>
                  <p className="text-lg font-semibold text-green-700">
                    {viewingCampaign.total_sent}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600">Failed</p>
                  <p className="text-lg font-semibold text-red-700">
                    {viewingCampaign.total_failed}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Sent At</p>
                <p className="text-sm text-gray-700">
                  {viewingCampaign.sent_at
                    ? new Date(viewingCampaign.sent_at).toLocaleString()
                    : "Not sent yet"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Body Preview</p>
                <div
                  className="bg-gray-50 rounded-lg p-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingCampaign.body }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {viewingCampaign.status !== 'sent' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleSendCampaign(viewingCampaign);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Send Now
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Confirmation Modal */}
        {showSendModal && sendingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => !isSending && setShowSendModal(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Campaign
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to send "{sendingCampaign.subject}" to all active subscribers?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Subject:</strong> {sendingCampaign.subject}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSend}
                  disabled={isSending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Campaigns ({campaigns.length})
          </h2>

          {loading && campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No campaigns found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Failed
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {campaign.subject}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status === 'sent' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : campaign.status === 'sending' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700">
                            {campaign.total_recipients}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-green-700 font-medium">
                            {campaign.total_sent}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-red-700 font-medium">
                            {campaign.total_failed}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setViewingCampaign(campaign);
                                setShowViewModal(true);
                              }}
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {campaign.status !== 'sent' && (
                              <button
                                onClick={() => handleSendCampaign(campaign)}
                                className="p-1.5 bg-blue-100 rounded-md hover:bg-blue-200 text-blue-700"
                                title="Send"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(campaign)}
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
      {showDeleteModal && deletingCampaign && (
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
                Delete Campaign
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingCampaign.subject}"? This
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
