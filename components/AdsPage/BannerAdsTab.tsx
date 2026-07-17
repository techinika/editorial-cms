"use client";

import React from "react";
import {
  Search, Trash2, Edit2, Image, ExternalLink, LayoutGrid, Tag as TagIcon, BarChart3,
} from "lucide-react";
import { BannerAd, BannerAdFormData, BannerType, BannerLocation } from "@/types/banner-ad";
import AdEditModal from "./AdEditModal";

interface BannerAdsTabProps {
  ads: BannerAd[];
  adsLoading: boolean;
  adsHasMore: boolean;
  adsSearchQuery: string;
  locationFilter: BannerLocation | "";
  typeFilter: BannerType | "";
  showEditModal: boolean;
  editingAd: BannerAd | null;
  onLocationFilter: (f: BannerLocation | "") => void;
  onTypeFilter: (f: BannerType | "") => void;
  onSearch: (query: string) => void;
  onEditAd: (ad: BannerAd) => void;
  onDeleteClick: (item: BannerAd, type: "banner_ad") => void;
  onSaveAd: (formData: BannerAdFormData) => void;
  onCloseModal: () => void;
  onLoadMore: () => void;
  onSelectAsset: (cb: (id: string, url: string) => void) => void;
  onSelectCompany: (cb: (id: string, name: string) => void) => void;
}

const FILTER_BUTTON_CLASS = (active: boolean) =>
  `px-4 py-2 rounded-md transition-colors text-sm font-medium ${
    active ? "bg-[#3182ce] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
  }`;

function getBannerTypeIcon(type: BannerType) {
  switch (type) {
    case "square": return <LayoutGrid className="w-4 h-4" />;
    case "vertical": return <LayoutGrid className="w-4 h-4 rotate-90" />;
    default: return <LayoutGrid className="w-4 h-4" />;
  }
}

export default function BannerAdsTab({
  ads, adsLoading, adsHasMore, adsSearchQuery, locationFilter, typeFilter,
  showEditModal, editingAd, onLocationFilter, onTypeFilter, onSearch,
  onEditAd, onDeleteClick, onSaveAd, onCloseModal, onLoadMore,
  onSelectAsset, onSelectCompany,
}: BannerAdsTabProps) {
  return (
    <>
      <div className="flex items-center gap-4 justify-between flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => onLocationFilter("")} className={FILTER_BUTTON_CLASS(locationFilter === "")}>All Locations</button>
          <button onClick={() => onLocationFilter("sidebar")} className={FILTER_BUTTON_CLASS(locationFilter === "sidebar")}>Sidebar</button>
          <button onClick={() => onLocationFilter("article_inline")} className={FILTER_BUTTON_CLASS(locationFilter === "article_inline")}>Article Inline</button>
          <button onClick={() => onTypeFilter("")} className={FILTER_BUTTON_CLASS(typeFilter === "")}>All Types</button>
          <button onClick={() => onTypeFilter("square")} className={FILTER_BUTTON_CLASS(typeFilter === "square")}><LayoutGrid className="w-4 h-4 inline mr-1" />Square</button>
          <button onClick={() => onTypeFilter("vertical")} className={FILTER_BUTTON_CLASS(typeFilter === "vertical")}><LayoutGrid className="w-4 h-4 rotate-90 inline mr-1" />Vertical</button>
          <button onClick={() => onTypeFilter("horizontal")} className={FILTER_BUTTON_CLASS(typeFilter === "horizontal")}><LayoutGrid className="w-4 h-4 inline mr-1" />Horizontal</button>
        </div>
        <div className="relative group w-48">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
          <input type="text" placeholder="Search ads..." value={adsSearchQuery} onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none" />
        </div>
      </div>

      {showEditModal && (
        <AdEditModal isOpen={showEditModal} onClose={onCloseModal} ad={editingAd} onSave={onSaveAd}
          onSelectAsset={onSelectAsset} onSelectCompany={onSelectCompany} />
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">All Banner Ads ({ads.length})</h2>
        {adsLoading && ads.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><Image className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>No banner ads found</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {ads.map((ad) => (
                <div key={ad.id} className="group cursor-pointer">
                  <div className="aspect-[4/3] bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
                    {ad.image_ref_asset?.url ? (
                      <img src={ad.image_ref_asset.url} alt={ad.title} className="w-full h-full object-cover" />
                    ) : ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Image className="w-12 h-12 text-gray-300" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent" />
                    {ad.is_active !== false && <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">Active</span>}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {getBannerTypeIcon(ad.banner_type)}
                      <span className="text-xs bg-white/90 px-1.5 py-0.5 rounded">{ad.banner_type}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm" title="Open Link"><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={(e) => { e.stopPropagation(); onEditAd(ad); }} className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(ad, "banner_ad"); }} className="p-1.5 bg-white/90 rounded-md hover:bg-white text-red-600 shadow-sm" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate w-full leading-tight">{ad.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1"><TagIcon className="w-3 h-3 text-[#3182ce]" />{ad.location}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" />{ad.current_views || 0} views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {adsHasMore && !adsSearchQuery && (
              <div className="mt-8 flex justify-center">
                <button onClick={onLoadMore} disabled={adsLoading}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50">
                  {adsLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
