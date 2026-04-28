"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  FileText,
  Search,
  X,
  Trash2,
  Edit2,
  Image,
  Video,
  File,
  ExternalLink,
  AlertTriangle,
  Check,
  Eye,
  Upload,
  Loader2,
  FileImage,
} from "lucide-react";
import { Asset, AssetType, AssetFormData } from "@/types/asset";
import {
  getAssets,
  getAssetsByType,
  searchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetUsage,
} from "@/supabase/CRUD/querries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import AssetAssignModal from "@/components/AssetAssignModal";
import { upload } from "@imagekit/next";

interface AssetsPageProps {
  user?: AuthResult;
}

export default function AssetsPage({ user }: AssetsPageProps) {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [typeFilter, setTypeFilter] = useState<AssetType | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState<string>("");
  const [formType, setFormType] = useState<AssetType>("image");
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<{
    name: string;
    url: string;
    type: AssetType;
  } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showUsageModal, setShowUsageModal] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [assetUsage, setAssetUsage] = useState<{
    articles: Array<{ id: string; title: string; slug: string; field: string }>;
  }>({ articles: [] });
  const [usageLoading, setUsageLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    const userId = user?.user?.id;
    const isAdmin = user?.isAdmin || false;
    const data = typeFilter
      ? await getAssetsByType(typeFilter, 0, 20, userId, isAdmin)
      : await getAssets(0, 20, userId, isAdmin);
    setAssets(data);
    setHasMore(data.length === 20);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const userId = user?.user?.id;
    const isAdmin = user?.isAdmin || false;
    const newAssets = typeFilter
      ? await getAssetsByType(typeFilter, page, 20, userId, isAdmin)
      : await getAssets(page, 20, userId, isAdmin);
    setAssets((prev) => [...prev, ...newAssets]);
    setPage((prev) => prev + 1);
    setHasMore(newAssets.length === 20);
    setLoading(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadAssets();
      return;
    }
    setSearching(true);
    const userId = user?.user?.id;
    const isAdmin = user?.isAdmin || false;
    const results = await searchAssets(query, userId, isAdmin);
    setAssets(results);
    setSearching(false);
  }, [user]);

  useEffect(() => {
    if (typeFilter !== undefined) {
      loadAssets();
    }
  }, [typeFilter]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setSelectedFile(file);

    try {
      const authResponse = await fetch("/api/upload-auth");
      const authData = await authResponse.json();

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const result = await upload({
            file: reader.result as string,
            fileName: file.name,
            folder: "/assets",
            publicKey: authData.publicKey,
            token: authData.token,
            signature: authData.signature,
            expire: authData.expire,
          });

          if ((result as any)?.url) {
            const uploadedUrl = (result as any).url;
            setFormUrl(uploadedUrl);
            
            const assetPreview = {
              name: file.name.split(".")[0] || file.name,
              url: uploadedUrl,
              type: formType,
            };
            setPreviewAsset(assetPreview);
            setShowPreviewModal(true);
            
            if (!formName) {
              setFormName(assetPreview.name);
            }
          }
        } catch (error) {
          console.error("Upload error:", error);
          showToast("error", "Failed to upload file");
          setUploading(false);
        }
      };
    } catch (error) {
      console.error("Auth error:", error);
      showToast("error", "Failed to authenticate upload");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    setFormLoading(true);

    if (editingAsset) {
      const result = await updateAsset(editingAsset.id, {
        name: formName,
        url: formUrl,
        type: formType,
      });
      if (result) {
        setAssets((prev) =>
          prev.map((a) => (a.id === editingAsset.id ? result : a)),
        );
        resetForm();
        showToast("success", "Asset updated successfully!");
      }
    } else {
      const result = await createAsset({
        name: formName,
        url: formUrl,
        type: formType,
        author_id: user?.user?.id,
      });
      if (result) {
        setAssets((prev) => [result, ...prev]);
        resetForm();
        showToast("success", "Asset added successfully!");
      }
    }

    setFormLoading(false);
  };

  const confirmAssetSave = async () => {
    if (!previewAsset) return;
    
    setFormLoading(true);
    setShowPreviewModal(false);

    const result = await createAsset({
      name: formName,
      url: formUrl,
      type: formType,
      author_id: user?.user?.id,
    });

    if (result) {
      setAssets((prev) => [result, ...prev]);
      resetForm();
      showToast("success", "Asset added successfully!");
    }

    setFormLoading(false);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormUrl(asset.url);
    setFormType(asset.type);
    setShowForm(true);
  };

  const handleDeleteClick = (asset: Asset) => {
    setDeletingAsset(asset);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAsset) return;

    setDeleteLoading(true);
    const success = await deleteAsset(deletingAsset.id);
    if (success) {
      setAssets((prev) => prev.filter((a) => a.id !== deletingAsset.id));
      showToast("success", "Asset deleted successfully!");
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
    setDeletingAsset(null);
  };

  const handleViewUsage = async (asset: Asset) => {
    setViewingAsset(asset);
    setShowUsageModal(true);
    setUsageLoading(true);
    const usage = await getAssetUsage(asset.id);
    setAssetUsage(usage);
    setUsageLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAsset(null);
    setFormName("");
    setFormUrl("");
    setFormType("image");
    setSelectedFile(null);
    setPreviewAsset(null);
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Video className="w-5 h-5 text-purple-500" />;
      case "doc":
        return <File className="w-5 h-5 text-orange-500" />;
    }
  };

  const filteredAssets = searchQuery
    ? assets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.url.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : assets;

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
          <h1 className="text-xl font-medium">Assets</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
            />
          </div>
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
              onClick={() => setShowForm(true)}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Add Asset</span>
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
          </div>
        </section>

        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setTypeFilter("")}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              typeFilter === ""
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              typeFilter === "image"
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Image className="w-4 h-4" />
            Images
          </button>
          <button
            onClick={() => setTypeFilter("video")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              typeFilter === "video"
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Video className="w-4 h-4" />
            Videos
          </button>
          <button
            onClick={() => setTypeFilter("doc")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              typeFilter === "doc"
                ? "bg-[#3182ce] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <File className="w-4 h-4" />
            Documents
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Asset name"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={
                        formType === "image"
                          ? "image/*"
                          : formType === "video"
                          ? "video/*"
                          : ".pdf,.doc,.docx,.txt"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={uploading}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#3182ce] file:text-white file:cursor-pointer hover:file:bg-[#2c5282] disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    {formUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        File uploaded successfully
                      </div>
                    )}
                    {!formUrl && !uploading && (
                      <p className="text-xs text-gray-500">
                        Upload a file to get started
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AssetType)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="doc">Document</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formName.trim() || !formUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingAsset ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingAsset ? "Update" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Assets ({filteredAssets.length})
          </h2>

          {loading && filteredAssets.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No assets found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="group cursor-pointer">
                    <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
                      {asset.type === "image" ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          {getAssetIcon(asset.type)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent" />

                      <div className="absolute top-2 left-2">
                        {getAssetIcon(asset.type)}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewUsage(asset);
                            }}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                            title="View Usage"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                            title="Open URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(asset);
                            }}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningAsset(asset);
                              setShowAssignModal(true);
                            }}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-white text-[#3182ce] shadow-sm"
                            title="Assign"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(asset);
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
                        {asset.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {asset.views || 0} views
                      </p>
                    </div>
                  </div>
                ))}
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
                Delete Asset
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingAsset?.name}"? This
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

      {showUsageModal && viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUsageModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getAssetIcon(viewingAsset.type)}
                <h3 className="text-lg font-semibold text-gray-900">
                  Asset Usage: {viewingAsset.name}
                </h3>
              </div>
              <button
                onClick={() => setShowUsageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {usageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assetUsage.articles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>This asset is not used in any articles.</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found in {assetUsage.articles.length} article(s):
                </p>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">
                          Article
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">
                          Used As
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assetUsage.articles.map((article) => (
                        <tr key={article.id} className="hover:bg-white">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {article.title}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                              {article.field}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/edit/${article.id}`}
                              className="text-sm text-[#3182ce] hover:underline"
                            >
                              View Article
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreviewModal && previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowPreviewModal(false);
              setUploading(false);
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview Asset
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setUploading(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              {previewAsset.type === "image" ? (
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewAsset.url}
                    alt={previewAsset.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : previewAsset.type === "video" ? (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <Video className="w-16 h-16 text-gray-400" />
                  <p className="text-sm text-gray-500 ml-2">Video Preview</p>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <File className="w-16 h-16 text-gray-400" />
                  <p className="text-sm text-gray-500 ml-2">Document Preview</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {previewAsset.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {previewAsset.type}
              </p>
              <p className="text-sm text-gray-600 truncate">
                <span className="font-medium">URL:</span> {previewAsset.url}
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setUploading(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssetSave}
                disabled={formLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {formLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
        )}

      {showAssignModal && assigningAsset && (
        <AssetAssignModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningAsset(null);
          }}
          asset={assigningAsset}
        />
      )}
    </div>
  );
}
