"use client";

import React from "react";
import { EyeOff } from "lucide-react";
import Modal from "@/components/Modal";
import { JoinedArticle } from "@/types/article";

interface UnpublishModalProps {
  article: JoinedArticle;
  feedback: string;
  setFeedback: (feedback: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UnpublishModal({
  article,
  feedback,
  setFeedback,
  loading,
  onConfirm,
  onCancel,
}: UnpublishModalProps) {
  return (
    <Modal open onClose={onCancel} title="Unpublish Article" className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-100 rounded-full">
          <EyeOff className="w-6 h-6 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Unpublish Article
        </h3>
      </div>
      <p className="text-gray-600 mb-4">
        Are you sure you want to unpublish &quot;{article.title}&quot;? It
        will be moved back to draft status.
      </p>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for unpublishing (optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Why is this being unpublished?"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          Unpublish
        </button>
      </div>
    </Modal>
  );
}
