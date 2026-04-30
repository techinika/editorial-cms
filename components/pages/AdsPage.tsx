"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  FileText,
  Search,
  X,
  Trash2,
  Edit2,
  Image,
  ExternalLink,
  AlertTriangle,
  Eye,
  Loader2,
  Link2,
  Building2,
  LayoutGrid,
  Tag as TagIcon,
  Calendar,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Layers,
} from "lucide-react";
import { BannerAd, BannerAdFormData, BannerType, BannerLocation } from "@/types/banner-ad";
import { TopBanner, TopBannerFormData } from "@/types/top-banner";
import {
  getBannerAds,
  getBannerAdById,
  createBannerAd,
  updateBannerAd,
  deleteBannerAd,
} from "@/supabase/CRUD/querries";
import {
  getTopBanners,
  getTopBannerById,
  createTopBanner,
  updateTopBanner,
  deleteTopBanner,
  getActiveTopBanners,
} from "@/supabase/CRUD/querries";
import {
  getAssets,
  searchAssets,
} from "@/supabase/CRUD/querries";
import {
  getFeaturedStartups,
  searchFeaturedStartups,
} from "@/supabase/CRUD/querries";
import { Asset } from "@/types/asset";
import { FeaturedStartup } from "@/types/user-company";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { supabaseAdminClient } from "@/supabase/supabase";

interface AdsPageProps {
  user?: AuthResult;
}

type TabType = "banner_ads" | "top_banners";

export default function AdsPage({ user }: AdsPageProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("banner_ads");

  // Banner Ads state
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsPage, setAdsPage] = useState(1);
  const [adsHasMore, setAdsHasMore] = useState(true);
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsSearching, setAdsSearching] = useState(false);

  // Banner Ads filter states
  const [locationFilter, setLocationFilter] = useState<BannerLocation | "">("");
  const [typeFilter, setTypeFilter] = useState<BannerType | "">("");

  // Top Banners state
  const [topBanners, setTopBanners] = useState<TopBanner[]>([]);
  const [topBannersLoading, setTopBannersLoading] = useState(true);
  const [topBannersPage, setTopBannersPage] = useState(1);
  const [topBannersHasMore, setTopBannersHasMore] = useState(true);
  const [topBannersSearchQuery, setTopBannersSearchQuery] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAd, setEditingAd] = useState<BannerAd | null>(null);
  const [editingTopBanner, setEditingTopBanner] = useState<TopBanner | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAd, setDeletingAd] = useState<BannerAd | TopBanner | null>(null);
  const [deleteType, setDeleteType] = useState<"banner_ad" | "top_banner">("banner_ad");

  // Asset selection for ad
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetSelectCallback, setAssetSelectCallback] = useState<((assetId: string, assetUrl: string) => void) | null>(null);

  // Company selection for ad
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companies, setCompanies] = useState<FeaturedStartup[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySelectCallback, setCompanySelectCallback] = useState<((companyId: string, companyName: string) => void) | null>(null);

  useEffect(() => {
    if (activeTab === "banner_ads") {
      // Build filters from current state
      const filters: { location?: string; banner_type?: string } = {};
      if (locationFilter) filters.location = locationFilter;
      if (typeFilter) filters.banner_type = typeFilter;
      loadAds(filters);

      // Set up realtime subscription for banner_ads
      const channel = supabaseAdminClient
        .channel('banner_ads_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'banner_ads' },
          (payload) => {
            console.log('Realtime update:', payload);
            // Reload with current filters
            const currentFilters: { location?: string; banner_type?: string } = {};
            if (locationFilter) currentFilters.location = locationFilter;
            if (typeFilter) currentFilters.banner_type = typeFilter;
            loadAds(currentFilters);
          }
        )
        .subscribe();

      return () => {
        supabaseAdminClient.removeChannel(channel);
      };
    } else {
      loadTopBanners();

      // Set up realtime subscription for top_banner
      const channel = supabaseAdminClient
        .channel('top_banner_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'top_banner' },
          (payload) => {
            console.log('Realtime update:', payload);
            loadTopBanners();
          }
        )
        .subscribe();

      return () => {
        supabaseAdminClient.removeChannel(channel);
      };
    }
  }, [activeTab, locationFilter, typeFilter]);

  // Reset filters when switching tabs
  useEffect(() => {
    setLocationFilter("");
    setTypeFilter("");
    setAdsSearchQuery("");
    setTopBannersSearchQuery("");
  }, [activeTab]);

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
    const data = await getTopBanners(0, 20);
    setTopBanners(data);
    setTopBannersHasMore(data.length === 20);
    setTopBannersLoading(false);
  };

  const loadMoreTopBanners = async () => {
    if (topBannersLoading || !topBannersHasMore) return;
    setTopBannersLoading(true);
    const newBanners = await getTopBanners(topBannersPage, 20);
    setTopBanners((prev) => [...prev, ...newBanners]);
    setTopBannersPage((prev) => prev + 1);
    setTopBannersHasMore(newBanners.length === 20);
    setTopBannersLoading(false);
  };

  const handleAdsSearch = useCallback(
    async (query: string) => {
      setAdsSearchQuery(query);
      if (!query.trim()) {
        // Reload with current filters applied
        const filters: { location?: string; banner_type?: string } = {};
        if (locationFilter) filters.location = locationFilter;
        if (typeFilter) filters.banner_type = typeFilter;
        loadAds(filters);
        return;
      }
      setAdsSearching(true);
      const filtered = ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(query.toLowerCase()) ||
          ad.description?.toLowerCase().includes(query.toLowerCase()) ||
          ad.link_url.toLowerCase().includes(query.toLowerCase()),
      );
      setAds(filtered);
      setAdsSearching(false);
    },
    [ads, locationFilter, typeFilter],
  );

  const handleTopBannersSearch = useCallback(
    async (query: string) => {
      setTopBannersSearchQuery(query);
      if (!query.trim()) {
        loadTopBanners();
        return;
      }
      const filtered = topBanners.filter(
        (banner) =>
          banner.title.toLowerCase().includes(query.toLowerCase()) ||
          banner.content.toLowerCase().includes(query.toLowerCase()),
      );
      setTopBanners(filtered);
    },
    [topBanners],
  );

  useEffect(() => {
    if (activeTab === "banner_ads") {
      // Use server-side filtering
      const filters: { location?: string; banner_type?: string } = {};
      if (locationFilter) filters.location = locationFilter;
      if (typeFilter) filters.banner_type = typeFilter;

      // Always call loadAds - if no filters, it loads all ads
      loadAds(filters);
    }
  }, [locationFilter, typeFilter, activeTab]);

  const handleSaveAd = async (formData: BannerAdFormData) => {
    if (editingAd) {
      const updated = await updateBannerAd(editingAd.id, formData);
      if (updated) {
        setAds((prev) =>
          prev.map((ad) => (ad.id === updated.id ? updated : ad)),
        );
        showToast("success", "Ad updated successfully!");
      }
    } else {
      const created = await createBannerAd(formData);
      if (created) {
        setAds((prev) => [created, ...prev]);
        showToast("success", "Ad created successfully!");
      }
    }
    setShowEditModal(false);
    setEditingAd(null);
  };

  const handleSaveTopBanner = async (formData: TopBannerFormData) => {
    if (editingTopBanner) {
      const updated = await updateTopBanner(editingTopBanner.id, formData);
      if (updated) {
        setTopBanners((prev) =>
          prev.map((banner) => (banner.id === updated.id ? updated : banner)),
        );
        showToast("success", "Top banner updated successfully!");
      }
    } else {
      const created = await createTopBanner(formData);
      if (created) {
        setTopBanners((prev) => [created, ...prev]);
        showToast("success", "Top banner created successfully!");
      }
    }
    setShowEditModal(false);
    setEditingTopBanner(null);
  };

  const handleEditAd = (ad: BannerAd) => {
    setEditingAd(ad);
    setEditingTopBanner(null);
    setShowEditModal(true);
  };

  const handleEditTopBanner = (banner: TopBanner) => {
    setEditingTopBanner(banner);
    setEditingAd(null);
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    if (activeTab === "banner_ads") {
      setEditingAd(null);
      setEditingTopBanner(null);
      setShowEditModal(true);
    } else {
      setEditingTopBanner(null);
      setEditingAd(null);
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = (item: BannerAd | TopBanner, type: "banner_ad" | "top_banner") => {
    setDeletingAd(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAd) return;

    setDeleteLoading(true);
    let success = false;

    if (deleteType === "banner_ad") {
      success = await deleteBannerAd(deletingAd.id);
      if (success) {
        setAds((prev) => prev.filter((a) => a.id !== deletingAd.id));
      }
    } else {
      success = await deleteTopBanner(deletingAd.id);
      if (success) {
        setTopBanners((prev) => prev.filter((b) => b.id !== deletingAd.id));
      }
    }

    if (success) {
      showToast("success", "Deleted successfully!");
    }

    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingAd(null);
  };

  const [deleteLoading, setDeleteLoading] = useState(false);

  // Asset selection handlers
  const openAssetModal = (callback: (assetId: string, assetUrl: string) => void) => {
    setAssetSelectCallback(() => callback);
    setAssetSearchQuery("");
    loadAssetsForSelection();
    setShowAssetModal(true);
  };

  const loadAssetsForSelection = async () => {
    const data = await getAssets(0, 50);
    setAssets(data);
  };

  const handleAssetSearch = async (query: string) => {
    setAssetSearchQuery(query);
    if (!query.trim()) {
      loadAssetsForSelection();
      return;
    }
    const results = await searchAssets(query);
    setAssets(results);
  };

  const selectAsset = (asset: Asset) => {
    if (assetSelectCallback) {
      assetSelectCallback(asset.id, asset.url);
    }
    setShowAssetModal(false);
    setAssetSelectCallback(null);
  };

  // Company selection handlers
  const openCompanyModal = (callback: (companyId: string, companyName: string) => void) => {
    setCompanySelectCallback(() => callback);
    setCompanySearchQuery("");
    loadCompaniesForSelection();
    setShowCompanyModal(true);
  };

  const loadCompaniesForSelection = async () => {
    const data = await getFeaturedStartups(0, 50);
    setCompanies(data);
  };

  const handleCompanySearch = async (query: string) => {
    setCompanySearchQuery(query);
    if (!query.trim()) {
      loadCompaniesForSelection();
      return;
    }
    const results = await searchFeaturedStartups(query);
    setCompanies(results);
  };

  const selectCompany = (company: FeaturedStartup) => {
    if (companySelectCallback) {
      companySelectCallback(company.id, company.name);
    }
    setShowCompanyModal(false);
    setCompanySelectCallback(null);
  };

  const getBannerTypeIcon = (type: BannerType) => {
    switch (type) {
      case "square":
        return <LayoutGrid className="w-4 h-4" />;
      case "vertical":
        return <LayoutGrid className="w-4 h-4 rotate-90" />;
      case "horizontal":
        return <LayoutGrid className="w-4 h-4 rotate-0" />;
      default:
        return <LayoutGrid className="w-4 h-4" />;
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
          <h1 className="text-xl font-medium">Ad Management</h1>
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
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("banner_ads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              activeTab === "banner_ads"
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Banner Ads
          </button>
          <button
            onClick={() => setActiveTab("top_banners")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              activeTab === "top_banners"
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Top Banners
          </button>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <button
              onClick={handleAddNew}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">
                {activeTab === "banner_ads" ? "Create New Ad" : "Create Top Banner"}
              </span>
            </button>

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
                <Image
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>
          </div>
        </section>

        {/* Banner Ads Tab */}
        {activeTab === "banner_ads" && (
          <>
            <div className="flex items-center gap-4 justify-between flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setLocationFilter("")}
                  className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    locationFilter === ""
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  All Locations
                </button>
                <button
                  onClick={() => setLocationFilter("sidebar")}
                  className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    locationFilter === "sidebar"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Sidebar
                </button>
                <button
                  onClick={() => setLocationFilter("article_inline")}
                  className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    locationFilter === "article_inline"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Article Inline
                </button>

                <button
                  onClick={() => setTypeFilter("")}
                  className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    typeFilter === ""
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter("square")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    typeFilter === "square"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Square
                </button>
                <button
                  onClick={() => setTypeFilter("vertical")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    typeFilter === "vertical"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 rotate-90" />
                  Vertical
                </button>
                <button
                  onClick={() => setTypeFilter("horizontal")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                    typeFilter === "horizontal"
                      ? "bg-[#3182ce] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Horizontal
                </button>
              </div>

              <div className="relative group w-48">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
                <input
                  type="text"
                  placeholder="Search ads..."
                  value={adsSearchQuery}
                  onChange={(e) => handleAdsSearch(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Edit/Create Ad Modal */}
            {showEditModal && activeTab === "banner_ads" && (
              <AdEditModal
                isOpen={showEditModal}
                onClose={() => {
                  setShowEditModal(false);
                  setEditingAd(null);
                }}
                ad={editingAd}
                onSave={handleSaveAd}
                onSelectAsset={openAssetModal}
                onSelectCompany={openCompanyModal}
              />
            )}

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                All Banner Ads ({ads.length})
              </h2>

              {adsLoading && ads.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No banner ads found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {ads.map((ad) => (
                      <div key={ad.id} className="group cursor-pointer">
                        <div className="aspect-[4/3] bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
                          {ad.image_ref_asset?.url ? (
                            <img
                              src={ad.image_ref_asset.url}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : ad.image_url ? (
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Image className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent" />

                          {ad.is_active !== false && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                              Active
                            </span>
                          )}

                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {getBannerTypeIcon(ad.banner_type)}
                            <span className="text-xs bg-white/90 px-1.5 py-0.5 rounded">
                              {ad.banner_type}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              <a
                                href={ad.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                                title="Open Link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAd(ad);
                                }}
                                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(ad, "banner_ad");
                                }}
                                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-red-600 shadow-sm"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate w-full leading-tight">
                            {ad.title}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <TagIcon className="w-3 h-3 text-[#3182ce]" />
                              {ad.location}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {ad.current_views || 0} views
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {adsHasMore && !adsSearchQuery && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={loadMoreAds}
                        disabled={adsLoading}
                        className="px-6 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {adsLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* Top Banners Tab */}
        {activeTab === "top_banners" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="relative group w-48">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
                <input
                  type="text"
                  placeholder="Search top banners..."
                  value={topBannersSearchQuery}
                  onChange={(e) => handleTopBannersSearch(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Edit/Create Top Banner Modal */}
            {showEditModal && activeTab === "top_banners" && (
              <TopBannerEditModal
                isOpen={showEditModal}
                onClose={() => {
                  setShowEditModal(false);
                  setEditingTopBanner(null);
                }}
                banner={editingTopBanner}
                onSave={handleSaveTopBanner}
              />
            )}

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                All Top Banners ({topBanners.length})
              </h2>

              {topBannersLoading && topBanners.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : topBanners.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No top banners found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {topBanners.map((banner) => (
                      <div
                        key={banner.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#3182ce] transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {banner.title}
                              </h3>
                              {banner.is_active && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                                  Active
                                </span>
                              )}
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded"
                                style={{
                                  backgroundColor: banner.background_color || "#38b6ff",
                                  color: banner.text_color || "#FFFFFF",
                                }}
                              >
                                Preview
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {banner.content}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {banner.link_url && (
                                <span className="flex items-center gap-1">
                                  <Link2 className="w-3 h-3" />
                                  {banner.link_text || "Link"}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(banner.start_date).toLocaleDateString()} - {new Date(banner.end_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                Order: {banner.display_order}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <button
                              onClick={() => handleEditTopBanner(banner)}
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(banner, "top_banner")}
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {topBannersHasMore && !topBannersSearchQuery && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={loadMoreTopBanners}
                        disabled={topBannersLoading}
                        className="px-6 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {topBannersLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
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
                Delete {deleteType === "banner_ad" ? "Ad" : "Top Banner"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingAd?.title}"? This
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

      {/* Asset Selection Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAssetModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Asset
              </h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative group mb-4">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={assetSearchQuery}
                onChange={(e) => handleAssetSearch(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {assets
                .filter((a) => a.type === "image")
                .map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => selectAsset(asset)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-[#3182ce] transition-colors">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {asset.name}
                    </p>
                  </div>
                ))}
            </div>

            {assets.filter((a) => a.type === "image").length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No image assets found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Selection Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCompanyModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Company
              </h3>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative group mb-4">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
              <input
                type="text"
                placeholder="Search companies..."
                value={companySearchQuery}
                onChange={(e) => handleCompanySearch(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {company.name}
                    </p>
                    {company.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {company.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {companies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No companies found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Ad Edit Modal Component
function AdEditModal({
  isOpen,
  onClose,
  ad,
  onSave,
  onSelectAsset,
  onSelectCompany,
}: {
  isOpen: boolean;
  onClose: () => void;
  ad: BannerAd | null;
  onSave: (formData: BannerAdFormData) => void;
  onSelectAsset: (callback: (assetId: string, assetUrl: string) => void) => void;
  onSelectCompany: (callback: (companyId: string, companyName: string) => void) => void;
}) {
  const [formData, setFormData] = useState<BannerAdFormData>({
    title: ad?.title || "",
    link_url: ad?.link_url || "",
    description: ad?.description || "",
    location: ad?.location || "sidebar",
    banner_type: ad?.banner_type || "square",
    target_pages: ad?.target_pages || "",
    target_categories: ad?.target_categories || "",
    is_active: ad?.is_active ?? true,
    display_order: ad?.display_order ?? 0,
    start_date: ad?.start_date || "",
    end_date: ad?.end_date || "",
    max_views: ad?.max_views ?? 0,
    image_ref: ad?.image_ref || "",
    related_company: ad?.related_company || "",
  });

  const [selectedAssetUrl, setSelectedAssetUrl] = useState(
    ad?.image_ref_asset?.url || ad?.image_url || "",
  );
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    ad?.related_company_featured?.name || "",
  );

  const handleAssetSelect = (assetId: string, assetUrl: string) => {
    setFormData((prev) => ({ ...prev, image_ref: assetId }));
    setSelectedAssetUrl(assetUrl);
  };

  const handleCompanySelect = (companyId: string, companyName: string) => {
    setFormData((prev) => ({ ...prev, related_company: companyId }));
    setSelectedCompanyName(companyName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {ad ? "Edit Ad" : "Create New Ad"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL *
            </label>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <input
                type="url"
                required
                value={formData.link_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value as BannerLocation }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              >
                <option value="sidebar">Sidebar</option>
                <option value="article_inline">Article Inline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Type
              </label>
              <select
                value={formData.banner_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, banner_type: e.target.value as BannerType }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              >
                <option value="square">Square</option>
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image (Asset)
            </label>
            <div className="flex items-center gap-3">
              {selectedAssetUrl && (
                <img
                  src={selectedAssetUrl}
                  alt="Selected"
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
              )}
              <button
                type="button"
                onClick={() => onSelectAsset(handleAssetSelect)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                {selectedAssetUrl ? "Change Asset" : "Select Asset"}
              </button>
              {!formData.image_ref && (
                <span className="text-xs text-gray-500">
                  No asset selected
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Company
            </label>
            <div className="flex items-center gap-3">
              {selectedCompanyName && (
                <span className="text-sm text-gray-700">{selectedCompanyName}</span>
              )}
              <button
                type="button"
                onClick={() => onSelectCompany(handleCompanySelect)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                {selectedCompanyName ? "Change Company" : "Select Company"}
              </button>
              {formData.related_company && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, related_company: "" }));
                    setSelectedCompanyName("");
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Pages (JSON)
              </label>
              <input
                type="text"
                value={formData.target_pages || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_pages: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                placeholder='["home", "article"]'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Categories (JSON)
              </label>
              <input
                type="text"
                value={formData.target_categories || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_categories: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                placeholder='["tech", "business"]'
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Views (0 = unlimited)
              </label>
              <input
                type="number"
                value={formData.max_views}
                onChange={(e) => setFormData((prev) => ({ ...prev, max_views: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Is Active
              </label>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  formData.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {formData.is_active ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {formData.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.start_date || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>
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
               {ad ? "Update Ad" : "Create Ad"}
             </button>
           </div>
         </form>
       </div>
     </div>
   );
 }

// Top Banner Edit Modal Component
function TopBannerEditModal({
  isOpen,
  onClose,
  banner,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  banner: TopBanner | null;
  onSave: (formData: TopBannerFormData) => void;
}) {
  const [formData, setFormData] = useState<TopBannerFormData>({
    title: banner?.title || "",
    content: banner?.content || "",
    link_url: banner?.link_url || "",
    link_text: banner?.link_text || "",
    background_color: banner?.background_color || "#38b6ff",
    text_color: banner?.text_color || "#FFFFFF",
    start_date: banner?.start_date || "",
    end_date: banner?.end_date || "",
    is_active: banner?.is_active ?? true,
    display_order: banner?.display_order ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {banner ? "Edit Top Banner" : "Create New Top Banner"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
              placeholder="Banner text content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <input
                type="url"
                value={formData.link_url || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Text
              </label>
              <input
                type="text"
                value={formData.link_text || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, link_text: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                placeholder="Click here"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.background_color || "#38b6ff"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                  className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.background_color || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.text_color || "#FFFFFF"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
                  className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.text_color || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Is Active
              </label>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  formData.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {formData.is_active ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {formData.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: formData.background_color || "#38b6ff",
                color: formData.text_color || "#FFFFFF",
              }}
            >
              <p className="font-medium">{formData.title}</p>
              <p className="text-sm mt-1">{formData.content}</p>
              {formData.link_url && (
                <a
                  href="#"
                  className="inline-block mt-2 text-sm underline"
                  style={{ color: formData.text_color || "#FFFFFF" }}
                  onClick={(e) => e.preventDefault()}
                >
                  {formData.link_text || "Learn More"}
                </a>
              )}
            </div>
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
              {banner ? "Update Banner" : "Create Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
