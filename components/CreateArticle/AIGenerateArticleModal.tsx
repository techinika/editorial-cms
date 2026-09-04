"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import Modal from "@/components/Modal";

interface AIGenerateArticleModalProps {
  open: boolean;
  onClose: () => void;
  isGenerating: boolean;
  onGenerate: (sourceMaterial: string) => void;
}

export default function AIGenerateArticleModal({
  open,
  onClose,
  isGenerating,
  onGenerate,
}: AIGenerateArticleModalProps) {
  const [sourceMaterial, setSourceMaterial] = useState("");

  useEffect(() => {
    if (open) setSourceMaterial("");
  }, [open]);

  const handleClose = () => {
    if (isGenerating) return;
    onClose();
  };

  const handleGenerate = () => {
    if (!sourceMaterial.trim() || isGenerating) return;
    onGenerate(sourceMaterial);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Generate Article with AI"
      className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-[#3182ce]/10 text-[#3182ce]">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-semibold text-gray-800">Generate Article with AI</h2>
        </div>
        <button
          onClick={handleClose}
          disabled={isGenerating}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        <label htmlFor="ai-source-material" className="block text-xs font-medium text-gray-600 mb-1.5">
          Source material
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Paste a press release, LinkedIn post, program page, or announcement. The AI will write a full
          article (headline + content) from it.
        </p>
        <textarea
          id="ai-source-material"
          value={sourceMaterial}
          onChange={(e) => setSourceMaterial(e.target.value)}
          placeholder="Paste your press release, LinkedIn post, program page, or announcement here..."
          rows={8}
          autoFocus
          disabled={isGenerating}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3182ce]/50 resize-y disabled:opacity-60"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">{sourceMaterial.trim().length} characters</span>
          <span className="text-xs text-gray-400">Replaces the current title and body with the draft.</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 rounded-b-lg">
        <button
          onClick={handleClose}
          disabled={isGenerating}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={!sourceMaterial.trim() || isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#3182ce" }}
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>
    </Modal>
  );
}