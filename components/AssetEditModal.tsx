"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { X, Loader2, Check, Upload, FileText, Image, Video, File, AlertTriangle } from "lucide-react";
import { Asset, AssetType, AssetFormData } from "@/types/asset";
import { createAsset, updateAsset } from "@/supabase/CRUD/queries";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";
import { upload } from "@imagekit/next";

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  user?: AuthResult;
  onSave: (newAsset: Asset) => void;
}

export default function AssetEditModal({ isOpen, onClose, asset, user, onSave }: AssetEditModalProps) {
  const { showToast } = useToast();

  const isEditing = !!asset;

  const [formName, setFormName] = useState(asset?.name || "");
  const [formUrl, setFormUrl] = useState<string>(asset?.url || "");
  const [formType, setFormType] = useState<AssetType>(asset?.type || "image");
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<{
    name: string;
    url: string;
    type: AssetType;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormName(asset?.name || "");
      setFormUrl(asset?.url || "");
      setFormType(asset?.type || "image");
      setSelectedFile(null);
      setPreviewAsset(null);
      setShowPreviewModal(false);
    }
  }, [isOpen, asset]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormUrl("");
    setFormType("image");
    setSelectedFile(null);
    setPreviewAsset(null);
    setShowPreviewModal(false);
    setFormLoading(false);
    setUploading(false);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAsset({
          name: file.name,
          url: reader.result as string,
          type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "doc",
        });
        setShowPreviewModal(true);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewAsset(null);
      setShowPreviewModal(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const authResponse = await fetch("/api/upload-auth");
      const authData = await authResponse.json();

      const result = await upload({
        file: selectedFile,
        fileName: selectedFile.name,
        folder: "/cms-assets",
        publicKey: authData.publicKey,
        token: authData.token,
        signature: authData.signature,
        expire: authData.expire,
      });

      if (result.url) {
        setFormUrl(result.url);
        setFormName(selectedFile.name.split(".").slice(0, -1).join("."));
        setFormType(selectedFile.type.startsWith("image/") ? "image" : selectedFile.type.startsWith("video/") ? "video" : "doc");
        showToast("success", "File uploaded successfully! Ready to save.");
        setShowPreviewModal(false);
      } else {
        showToast("error", "Failed to upload file to ImageKit.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("error", "Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const confirmAssetSave = async () => {
    if (!formName.trim() || !formUrl.trim()) {
      showToast("warning", "Name and URL are required.");
      return;
    }

    setFormLoading(true);
    let resultAsset: Asset | null = null;

    const assetData: AssetFormData = {
      name: formName,
      url: formUrl,
      type: formType,
      author_id: user?.user?.id,
    };

    if (isEditing && asset?.id) {
      resultAsset = await updateAsset(asset.id, assetData);
    } else {
      resultAsset = await createAsset(assetData);
    }

    if (resultAsset) {
      onSave(resultAsset);
      resetForm();
      showToast("success", `Asset ${isEditing ? "updated" : "added"} successfully!`);
      onClose();
    } else {
      showToast("error", `Failed to ${isEditing ? "update" : "add"} asset.`);
    }

    setFormLoading(false);
  };

  if (!isOpen) return null;

  const getFileIcon = (type: AssetType) => {
    switch (type) {
      case "image": return <Image className="w-12 h-12 text-blue-500" />;
      case "video": return <Video className="w-12 h-12 text-purple-500" />;
      case "doc": return <FileText className="w-12 h-12 text-orange-500" />;
      default: return <File className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{isEditing ? "Edit Asset" : "Add New Asset"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="assetName" className="block text-sm font-medium text-gray-700">Asset Name</label>
            <input
              type="text"
              id="assetName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter asset name"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] sm:text-sm"
              disabled={uploading || formLoading}
            />
          </div>

          <div>
            <label htmlFor="assetUrl" className="block text-sm font-medium text-gray-700">Asset URL</label>
            <input
              type="text"
              id="assetUrl"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="Enter asset URL or upload file"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] sm:text-sm"
              disabled={uploading || formLoading}
            />
          </div>

          <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-700">Asset Type</label>
            <select
              id="assetType"
              value={formType}
              onChange={(e) => setFormType(e.target.value as AssetType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] sm:text-sm rounded-md"
              disabled={uploading || formLoading}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="doc">Document</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">Upload File (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-[#3182ce] hover:text-[#2c5282] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#3182ce]/20"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={uploading || formLoading} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {selectedFile ? selectedFile.name : "PNG, JPG, GIF, MP4, PDF up to 10MB"}
                </p>
              </div>
            </div>
          </div>

          {showPreviewModal && previewAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-auto text-center">
                <h4 className="text-lg font-semibold mb-3">Confirm Upload</h4>
                <p className="text-gray-600 mb-4">Are you sure you want to upload this file?</p>
                <div className="mb-4 flex items-center justify-center">
                  {previewAsset.type.startsWith("image") && (
                    <img src={previewAsset.url} alt={previewAsset.name} className="max-w-full h-auto max-h-48 rounded-md" />
                  )}
                  {previewAsset.type.startsWith("video") && (
                    <video src={previewAsset.url} controls className="max-w-full h-auto max-h-48 rounded-md" />
                  )}
                  {previewAsset.type === "doc" && (
                    <div className="flex items-center justify-center h-48 w-48 bg-gray-100 rounded-md">
                      {getFileIcon(previewAsset.type)}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium mb-4 truncate">{previewAsset.name}</p>
                <div className="flex justify-around gap-4">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
            >
              Cancel
            </button>
             <button
               onClick={confirmAssetSave}
               disabled={Boolean(formLoading || uploading || (selectedFile && !formUrl))}
               className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
             >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isEditing ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
