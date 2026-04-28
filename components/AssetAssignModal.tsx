"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Check, Loader2, FileText, Image } from "lucide-react";
import { Asset, AssetType } from "@/types/asset";
import { getAllArticles, getAllAuthors, updateArticleThumbnail, updateAuthorImageRef } from "@/supabase/CRUD/querries";
import { useToast } from "@/components/Toast";

interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
}

export default function AssetAssignModal({ isOpen, onClose, asset }: AssetAssignModalProps) {
  const { showToast } = useToast();
  const [assignType, setAssignType] = useState<"article" | "author">("article");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Array<{ id: string; title?: string; name?: string; slug?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchData = async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      if (assignType === "article") {
        const data = await getAllArticles(search, 10);
        setResults(data);
      } else {
        const data = await getAllAuthors(search);
        setResults(data);
      }
      setLoading(false);
    };
    searchData();
  }, [search, assignType]);

  const handleAssign = async (targetId: string) => {
    setSaving(true);
    let success = false;
    if (assignType === "article") {
      success = await updateArticleThumbnail(targetId, asset.id);
      if (success) showToast("success", "Asset assigned as thumbnail!");
    } else {
      success = await updateAuthorImageRef(targetId, asset.id);
      if (success) showToast("success", "Asset assigned as profile image!");
    }
    setSaving(false);
    if (success) onClose();
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "image": return <Image className="w-5 h-5 text-blue-500" />;
      case "video": return <Image className="w-5 h-5 text-purple-500" />;
      case "doc": return <Image className="w-5 h-5 text-orange-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getAssetIcon(asset.type)}
            <h3 className="text-lg font-semibold text-gray-900">Assign: {asset.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAssignType("article")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              assignType === "article" ? "bg-[#3182ce] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" /> Article
          </button>
          <button
            onClick={() => setAssignType("author")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              assignType === "author" ? "bg-[#3182ce] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            <Image className="w-4 h-4" /> Author
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${assignType}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
          />
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#3182ce] animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? `No ${assignType}s found` : `Search for ${assignType}s`}
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleAssign(result.id)}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {assignType === "article" ? result.title : result.name}
                  </p>
                  {assignType === "article" && result.slug && (
                    <p className="text-xs text-gray-500">{result.slug}</p>
                  )}
                </div>
                <Check className="w-4 h-4 text-green-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}