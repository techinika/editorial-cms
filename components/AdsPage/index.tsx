"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Image, LayoutGrid, Layers } from "lucide-react";
import { BannerAd, BannerAdFormData, BannerType, BannerLocation } from "@/types/banner-ad";
import { TopBanner, TopBannerFormData } from "@/types/top-banner";
import {
  getBannerAds, createBannerAd, updateBannerAd, deleteBannerAd,
  getTopBanners, createTopBanner, updateTopBanner, deleteTopBanner,
} from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import supabase from "@/supabase/supabase";
import BannerAdsTab from "./BannerAdsTab";
import TopBannersTab from "./TopBannersTab";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AssetSelectModal from "./AssetSelectModal";
import CompanySelectModal from "./CompanySelectModal";

type TabType = "banner_ads" | "top_banners";

interface AdsPageProps {
  user?: AuthResult;
}

export default function AdsPage({ user }: AdsPageProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("banner_ads");

  const [ads, setAds] = useState<BannerAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsPage, setAdsPage] = useState(1);
  const [adsHasMore, setAdsHasMore] = useState(true);
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<BannerLocation | "">("");
  const [typeFilter, setTypeFilter] = useState<BannerType | "">("");

  const [topBanners, setTopBanners] = useState<TopBanner[]>([]);
  const [topBannersLoading, setTopBannersLoading] = useState(true);
  const [topBannersSearchQuery, setTopBannersSearchQuery] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAd, setEditingAd] = useState<BannerAd | null>(null);
  const [editingTopBanner, setEditingTopBanner] = useState<TopBanner | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAd, setDeletingAd] = useState<BannerAd | TopBanner | null>(null);
  const [deleteType, setDeleteType] = useState<"banner_ad" | "top_banner">("banner_ad");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetSelectCallback, setAssetSelectCallback] = useState<((id: string, url: string) => void) | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companySelectCallback, setCompanySelectCallback] = useState<((id: string, name: string) => void) | null>(null);

  const loadAds = async (filters?: { location?: string; banner_type?: string }) => {
    setAdsLoading(true);
    const data = await getBannerAds(0, 20, filters);
    setAds(data);
    setAdsHasMore(data.length === 20);
    setAdsLoading(false);
  };

  const loadMoreAds = async () => {
    if (adsLoading || !adsHasMore) return;
    setAdsLoading(true);
    const newAds = await getBannerAds(adsPage, 20);
    setAds((prev) => [...prev, ...newAds]);
    setAdsPage((prev) => prev + 1);
    setAdsHasMore(newAds.length === 20);
    setAdsLoading(false);
  };

  const loadTopBanners = async () => {
    setTopBannersLoading(true);
    const data = await getTopBanners();
    setTopBanners(data);
    setTopBannersLoading(false);
  };

  useEffect(() => {
    if (activeTab === "banner_ads") {
      const filters: { location?: string; banner_type?: string } = {};
      if (locationFilter) filters.location = locationFilter;
      if (typeFilter) filters.banner_type = typeFilter;
      loadAds(filters);
      const channel = supabase.channel("banner_ads_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "banner_ads" }, () => {
          const f: { location?: string; banner_type?: string } = {};
          if (locationFilter) f.location = locationFilter;
          if (typeFilter) f.banner_type = typeFilter;
          loadAds(f);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      loadTopBanners();
      const channel = supabase.channel("top_banner_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "top_banner" }, () => { loadTopBanners(); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab, locationFilter, typeFilter]);

  useEffect(() => {
    setLocationFilter(""); setTypeFilter(""); setAdsSearchQuery(""); setTopBannersSearchQuery("");
  }, [activeTab]);

  const handleAdsSearch = useCallback(async (query: string) => {
    setAdsSearchQuery(query);
    if (!query.trim()) {
      const filters: { location?: string; banner_type?: string } = {};
      if (locationFilter) filters.location = locationFilter;
      if (typeFilter) filters.banner_type = typeFilter;
      loadAds(filters);
      return;
    }
    if (locationFilter || typeFilter) { setLocationFilter(""); setTypeFilter(""); return; }
    const data = await getBannerAds(0, 20);
    setAds(data.filter((ad) =>
      ad.title.toLowerCase().includes(query.toLowerCase()) ||
      ad.description?.toLowerCase().includes(query.toLowerCase()) ||
      ad.link_url.toLowerCase().includes(query.toLowerCase())
    ));
  }, [locationFilter, typeFilter]);

  const handleTopBannersSearch = useCallback(async (query: string) => {
    setTopBannersSearchQuery(query);
    if (!query.trim()) { loadTopBanners(); return; }
    setTopBanners((prev) => prev.filter((b) =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.content.toLowerCase().includes(query.toLowerCase())
    ));
  }, []);

  const handleSaveAd = async (formData: BannerAdFormData) => {
    if (editingAd) {
      const updated = await updateBannerAd(editingAd.id, formData);
      if (updated) {
        setAds((prev) => prev.map((ad) => (ad.id === updated.id ? updated : ad)));
        showToast("success", "Ad updated successfully!");
      } else {
        showToast("error", "Failed to update ad");
      }
    } else {
      const created = await createBannerAd(formData);
      if (created) {
        setAds((prev) => [created, ...prev]);
        showToast("success", "Ad created successfully!");
      } else {
        showToast("error", "Failed to create ad");
      }
    }
    setShowEditModal(false); setEditingAd(null);
  };

  const handleSaveTopBanner = async (formData: TopBannerFormData) => {
    if (editingTopBanner) {
      const updated = await updateTopBanner(editingTopBanner.id, formData);
      if (updated) {
        setTopBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast("success", "Top banner updated!");
      } else {
        showToast("error", "Failed to update top banner");
      }
    } else {
      const created = await createTopBanner(formData);
      if (created) {
        setTopBanners((prev) => [created, ...prev]);
        showToast("success", "Top banner created!");
      } else {
        showToast("error", "Failed to create top banner");
      }
    }
    setShowEditModal(false); setEditingTopBanner(null);
  };

  const handleAddNew = () => {
    setEditingAd(null); setEditingTopBanner(null); setShowEditModal(true);
  };
  const handleEditAd = (ad: BannerAd) => { setEditingAd(ad); setEditingTopBanner(null); setShowEditModal(true); };
  const handleEditTopBanner = (banner: TopBanner) => { setEditingTopBanner(banner); setEditingAd(null); setShowEditModal(true); };
  const handleDeleteClick = (item: BannerAd | TopBanner, type: "banner_ad" | "top_banner") => {
    setDeletingAd(item); setDeleteType(type); setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAd) return;
    setDeleteLoading(true);
    let success = false;
    if (deleteType === "banner_ad") {
      success = await deleteBannerAd(deletingAd.id);
      if (success) setAds((prev) => prev.filter((a) => a.id !== deletingAd.id));
    } else {
      success = await deleteTopBanner(deletingAd.id);
      if (success) setTopBanners((prev) => prev.filter((b) => b.id !== deletingAd.id));
    }
    if (success) showToast("success", "Deleted successfully!");
    setDeleteLoading(false); setShowDeleteModal(false); setDeletingAd(null);
  };

  const openAssetModal = (callback: (id: string, url: string) => void) => {
    setAssetSelectCallback(() => callback); setShowAssetModal(true);
  };
  const selectAsset = (id: string, url: string) => {
    assetSelectCallback?.(id, url); setShowAssetModal(false); setAssetSelectCallback(null);
  };
  const openCompanyModal = (callback: (id: string, name: string) => void) => {
    setCompanySelectCallback(() => callback); setShowCompanyModal(true);
  };
  const selectCompany = (id: string, name: string) => {
    companySelectCallback?.(id, name); setShowCompanyModal(false); setCompanySelectCallback(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-[#3182ce] p-2 rounded-lg hover:bg-[#2c5282] transition-colors">
            <FileText className="text-white w-6 h-6" />
          </Link>
          <h1 className="text-xl font-medium">Ad Management</h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.authenticated && user.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.user.user_metadata.full_name || "User"} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                    {(user.user.user_metadata.full_name || user.user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium">{user.user.user_metadata.full_name || user.user.email}</span>
              </div>
              <Link href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`} className="px-4 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium">Log Out</Link>
            </div>
          ) : (
            <Link href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
              className="px-4 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium">Log In</Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setActiveTab("banner_ads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === "banner_ads" ? "bg-[#3182ce] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
            <LayoutGrid className="w-4 h-4" />Banner Ads
          </button>
          <button onClick={() => setActiveTab("top_banners")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === "top_banners" ? "bg-[#3182ce] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}>
            <Layers className="w-4 h-4" />Top Banners
          </button>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-6">
            <button onClick={handleAddNew} className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">{activeTab === "banner_ads" ? "Create New Ad" : "Create Top Banner"}</span>
            </button>
            <Link href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </Link>
            <Link href="/assets" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>
          </div>
        </section>

        {activeTab === "banner_ads" && (
          <BannerAdsTab
            ads={ads} adsLoading={adsLoading} adsHasMore={adsHasMore} adsSearchQuery={adsSearchQuery}
            locationFilter={locationFilter} typeFilter={typeFilter}
            showEditModal={showEditModal} editingAd={editingAd}
            onLocationFilter={setLocationFilter} onTypeFilter={setTypeFilter}
            onSearch={handleAdsSearch} onEditAd={handleEditAd} onDeleteClick={handleDeleteClick}
            onSaveAd={handleSaveAd} onCloseModal={() => { setShowEditModal(false); setEditingAd(null); }}
            onLoadMore={loadMoreAds} onSelectAsset={openAssetModal} onSelectCompany={openCompanyModal}
          />
        )}
        {activeTab === "top_banners" && (
          <TopBannersTab
            topBanners={topBanners} topBannersLoading={topBannersLoading}
            topBannersSearchQuery={topBannersSearchQuery}
            showEditModal={showEditModal} editingTopBanner={editingTopBanner}
            onSearch={handleTopBannersSearch} onEditBanner={handleEditTopBanner}
            onDeleteClick={handleDeleteClick} onSaveBanner={handleSaveTopBanner}
            onCloseModal={() => { setShowEditModal(false); setEditingTopBanner(null); }}
          />
        )}
      </main>

      <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete} deleteLoading={deleteLoading} item={deletingAd} deleteType={deleteType} />
      <AssetSelectModal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} onSelect={selectAsset} />
      <CompanySelectModal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} onSelect={selectCompany} />
    </div>
  );
}
