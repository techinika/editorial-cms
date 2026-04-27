"use client";

import React from "react";
import { X, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export type ConfirmModalType = "danger" | "warning" | "info";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmModalType;
  loading?: boolean;
}

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "info",
  loading = false,
}: ConfirmModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2 rounded-full ${
              type === "danger"
                ? "bg-red-100"
                : type === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
            }`}
          >
            {type === "danger" && (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            {type === "warning" && (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            )}
            {type === "info" && <HelpCircle className="w-6 h-6 text-blue-600" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 ${
              type === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : type === "warning"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-[#3182ce] hover:bg-[#2c5282]"
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;