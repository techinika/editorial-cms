"use client";

import React from "react";
import { Search, Trash2, Edit2, Link2, Calendar, Layers } from "lucide-react";
import { TopBanner, TopBannerFormData } from "@/types/top-banner";
import TopBannerEditModal from "./TopBannerEditModal";

interface TopBannersTabProps {
  topBanners: TopBanner[];
  topBannersLoading: boolean;
  topBannersSearchQuery: string;
  showEditModal: boolean;
  editingTopBanner: TopBanner | null;
  onSearch: (query: string) => void;
  onEditBanner: (banner: TopBanner) => void;
  onDeleteClick: (item: TopBanner, type: "top_banner") => void;
  onSaveBanner: (formData: TopBannerFormData) => void;
  onCloseModal: () => void;
}

export default function TopBannersTab({
  topBanners, topBannersLoading, topBannersSearchQuery, showEditModal,
  editingTopBanner, onSearch, onEditBanner, onDeleteClick, onSaveBanner, onCloseModal,
}: TopBannersTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="relative group w-48">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
          <input type="text" placeholder="Search top banners..." value={topBannersSearchQuery} onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none" />
        </div>
      </div>

      {showEditModal && (
        <TopBannerEditModal isOpen={showEditModal} onClose={onCloseModal} banner={editingTopBanner} onSave={onSaveBanner} />
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">All Top Banners ({topBanners.length})</h2>
        {topBannersLoading && topBanners.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topBanners.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>No top banners found</p></div>
        ) : (
          <div className="space-y-4">
            {topBanners.map((banner) => (
              <div key={banner.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#3182ce] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{banner.title}</h3>
                      {banner.is_active && <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">Active</span>}
                      <span className="px-2 py-0.5 text-xs font-medium rounded"
                        style={{ backgroundColor: banner.background_color || "#38b6ff", color: banner.text_color || "#FFFFFF" }}>Preview</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{banner.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {banner.link_url && (
                        <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{banner.link_text || "Link"}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(banner.start_date).toLocaleDateString()} - {new Date(banner.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">Order: {banner.display_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => onEditBanner(banner)} className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteClick(banner, "top_banner")} className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
