"use client";

import React from "react";
import { X } from "lucide-react";
import Modal from "@/components/Modal";

const PRIMARY_COLOR = "#3182ce";

interface AssetEditModalProps {
  editingAsset: { type: "image" | "video"; element: any };
  assetAltText: string;
  setAssetAltText: (value: string) => void;
  assetCaption: string;
  setAssetCaption: (value: string) => void;
  handleRemoveAsset: () => void;
  handleSwapAsset: () => void;
  updateAssetAltText: () => void;
  onClose: () => void;
}

export default function AssetEditModal({
  editingAsset,
  assetAltText,
  setAssetAltText,
  assetCaption,
  setAssetCaption,
  handleRemoveAsset,
  handleSwapAsset,
  updateAssetAltText,
  onClose,
}: AssetEditModalProps) {
  return (
    <Modal open onClose={onClose} title={editingAsset.type === "image" ? "Edit Image" : "Edit Video"} className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">
          {editingAsset.type === "image" ? "Edit Image" : "Edit Video"}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        <div className="p-4 space-y-4">
          {editingAsset.type === "image" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={assetAltText}
                onChange={(e) => setAssetAltText(e.target.value)}
                placeholder="Describe the image..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={assetCaption}
              onChange={(e) => setAssetCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleRemoveAsset}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Remove from Article
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSwapAsset}
              className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Swap Asset
            </button>
            {editingAsset.type === "image" && (
              <button
                onClick={updateAssetAltText}
                className="px-4 py-2 text-sm text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Update Alt Text
              </button>
            )}
          </div>
        </div>
    </Modal>
  );
}
