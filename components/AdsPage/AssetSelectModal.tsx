"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Image, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { Asset } from "@/types/asset";
import { getAssets, searchAssets } from "@/supabase/CRUD/queries";

interface AssetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string, assetUrl: string) => void;
}

export default function AssetSelectModal({ isOpen, onClose, onSelect }: AssetSelectModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAssets(0, 50).then((data) => { setAssets(data); setLoading(false); });
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      const data = await getAssets(0, 50);
      setAssets(data);
      return;
    }
    const results = await searchAssets(query);
    setAssets(results);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Select Asset" className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Asset</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative group mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {assets.filter((a) => a.type === "image").map((asset) => (
              <div key={asset.id} onClick={() => onSelect(asset.id, asset.url)} className="cursor-pointer group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-[#3182ce] transition-colors">
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-600 truncate mt-1">{asset.name}</p>
              </div>
            ))}
          </div>
          {assets.filter((a) => a.type === "image").length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No image assets found</p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
