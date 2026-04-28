"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Upload,
  Image,
  Video,
  File,
  Check,
  Loader2,
} from "lucide-react";
import { Asset, AssetType } from "@/types/asset";
import {
  getAssets,
  getAssetsByType,
  searchAssets,
  createAsset,
} from "@/supabase/CRUD/querries";
import { upload } from "@imagekit/next";
import { useToast } from "@/components/Toast";

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset, field?: "thumbnail" | "content") => void;
  currentAssetId?: string | null;
  user?: { id?: string; isAdmin?: boolean };
}

export default function AssetSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentAssetId,
  user,
}: AssetSelectionModalProps) {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "">("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<AssetType>("image");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, typeFilter]);

  const loadAssets = async () => {
    setLoading(true);
    const userId = user?.id;
    const isAdmin = user?.isAdmin || false;
    const data = typeFilter
      ? await getAssetsByType(typeFilter, 0, 20, userId, isAdmin)
      : await getAssets(0, 20, userId, isAdmin);
    setAssets(data);
    setHasMore(data.length === 20);
    setPage(1);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const userId = user?.id;
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
    setLoading(true);
    const userId = user?.id;
    const isAdmin = user?.isAdmin || false;
    const results = await searchAssets(query, userId, isAdmin);
    setAssets(results);
    setLoading(false);
  }, [user]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadName(file.name.split(".")[0] || file.name);
    setUploadType(
      file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "doc",
    );

    if (file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadName.trim()) return;

    setUploading(true);
    try {
      const authResponse = await fetch("/api/upload-auth");
      const authData = await authResponse.json();

      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        try {
          const result = await upload({
            file: reader.result as string,
            fileName: selectedFile.name,
            folder: "/assets",
            publicKey: authData.publicKey,
            token: authData.token,
            signature: authData.signature,
            expire: authData.expire,
          });

          if ((result as any)?.url) {
            const newAsset = await createAsset({
              name: uploadName,
              url: (result as any).url,
              type: uploadType,
              author_id: user?.id,
            });

            if (newAsset) {
              setAssets((prev) => [newAsset, ...prev]);
              setShowUploadForm(false);
              setSelectedFile(null);
              setUploadPreview(null);
              setUploadName("");
              showToast("success", "Asset uploaded successfully!");
            }
          }
        } catch (error) {
          console.error("Upload error:", error);
          showToast("error", "Failed to upload file");
        } finally {
          setUploading(false);
        }
      };
    } catch (error) {
      console.error("Auth error:", error);
      showToast("error", "Failed to authenticate upload");
      setUploading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Asset</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3182ce] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload New
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === ""
                  ? "bg-[#3182ce] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("image")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === "image"
                  ? "bg-[#3182ce] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Image className="w-4 h-4" />
              Images
            </button>
            <button
              onClick={() => setTypeFilter("video")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === "video"
                  ? "bg-[#3182ce] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Video className="w-4 h-4" />
              Videos
            </button>
            <button
              onClick={() => setTypeFilter("doc")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === "doc"
                  ? "bg-[#3182ce] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <File className="w-4 h-4" />
              Documents
            </button>
          </div>
        </div>

        {showUploadForm && (
          <div className="p-4 bg-gray-50 border-b">
            <h4 className="text-sm font-semibold mb-3">Upload New Asset</h4>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm"
              />

              {uploadPreview && (
                <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Asset name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm"
                />
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as AssetType)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="doc">Document</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                    setUploadPreview(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !uploadName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] text-sm font-medium disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No assets found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => onSelect(asset, "thumbnail")}
                    className={`group cursor-pointer ${
                      currentAssetId === asset.id ? "ring-2 ring-[#3182ce]" : ""
                    }`}
                  >
                    <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#3182ce] transition-all relative">
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
                      {currentAssetId === asset.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[#3182ce] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-600 truncate">
                      {asset.name}
                    </p>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
