"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { BannerAd } from "@/types/banner-ad";
import { TopBanner } from "@/types/top-banner";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteLoading: boolean;
  item: BannerAd | TopBanner | null;
  deleteType: "banner_ad" | "top_banner";
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleteLoading,
  item,
  deleteType,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title={`Delete ${deleteType === "banner_ad" ? "Ad" : "Top Banner"}`} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Delete {deleteType === "banner_ad" ? "Ad" : "Top Banner"}
        </h3>
      </div>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete &quot;{item?.title}&quot;? This
        action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
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
    </Modal>
  );
}
