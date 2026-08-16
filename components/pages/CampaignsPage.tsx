"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  FileText,
  Search,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  Send,
} from "lucide-react";
import {
  Campaign,
} from "@/types/campaign";
import {
  getCampaigns,
  deleteCampaign,
  getCampaignsCount,
} from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";
import TopNavbar from "@/components/TopNavbar";

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

  // View campaign modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Send state
  const [sendingId, setSendingId] = useState<string | null>(null);

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
      const filtered = campaigns.filter((c) =>
        c.subject.toLowerCase().includes(query.toLowerCase())
      );
      setCampaigns(filtered);
    },
    [campaigns],
  );

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
    setSendingId(campaign.id);

    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: campaign.subject,
          body: campaign.body,
          campaignId: campaign.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          "success",
          `Campaign queued! ${result.count} recipients will receive your email.`
        );
        loadCampaigns();
      } else {
        showToast("error", result.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      showToast("error", "Failed to send campaign");
    } finally {
      setSendingId(null);
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
      <TopNavbar
        title="Email Campaigns"
        icon={<Mail className="text-white w-6 h-6" />}
        badge={{ text: `${totalCount} total` }}
        user={user}
      />

      <main className="max-w-7xl mx-auto p-8">
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <Link href="/campaigns/new" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Mail className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Create Campaign</span>
            </Link>

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

          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>

        {/* Campaigns List */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Campaigns ({totalCount})
          </h2>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No campaigns yet</p>
              <p className="text-sm mt-2">Create your first email campaign to get started</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{campaign.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status === 'sending' ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              sending
                            </span>
                          ) : campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.total_recipients || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.open_rate ? `${campaign.open_rate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setViewingCampaign(campaign);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleSendCampaign(campaign)}
                              disabled={sendingId === campaign.id}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md disabled:opacity-50"
                              title="Send"
                            >
                              {sendingId === campaign.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(campaign)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
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
            </div>
          )}
        </section>

        {/* View Campaign Modal */}
        <Modal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingCampaign(null);
          }}
          title="Campaign Details"
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          {viewingCampaign && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {viewingCampaign.subject}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingCampaign.status)}`}>
                  {viewingCampaign.status}
                </span>
                <span>{viewingCampaign.total_recipients || 0} recipients</span>
                {viewingCampaign.open_rate && <span>{viewingCampaign.open_rate}% open rate</span>}
              </div>
              <div className="border border-gray-200 rounded-md p-4 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: viewingCampaign.body }} />
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Campaign"
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Campaign
            </h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete &quot;{deletingCampaign?.subject}&quot;? This
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
