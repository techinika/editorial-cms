"use client";

import React, { useState } from "react";
import { X, Link2, ToggleLeft, ToggleRight } from "lucide-react";
import Modal from "@/components/Modal";
import { BannerAd, BannerAdFormData, BannerType, BannerLocation } from "@/types/banner-ad";

interface AdEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: BannerAd | null;
  onSave: (formData: BannerAdFormData) => void;
  onSelectAsset: (callback: (assetId: string, assetUrl: string) => void) => void;
  onSelectCompany: (callback: (companyId: string, companyName: string) => void) => void;
}

export default function AdEditModal({ isOpen, onClose, ad, onSave, onSelectAsset, onSelectCompany }: AdEditModalProps) {
  const [formData, setFormData] = useState<BannerAdFormData>({
    title: ad?.title || "",
    link_url: ad?.link_url || "",
    description: ad?.description || "",
    location: ad?.location || "sidebar",
    banner_type: ad?.banner_type || "square",
    target_pages: ad?.target_pages || "",
    target_categories: ad?.target_categories || "",
    is_active: ad?.is_active ?? true,
    display_order: ad?.display_order ?? 0,
    start_date: ad?.start_date || "",
    end_date: ad?.end_date || "",
    max_views: ad?.max_views ?? 0,
    image_ref: ad?.image_ref || "",
    related_company: ad?.related_company || "",
  });
  const [selectedAssetUrl, setSelectedAssetUrl] = useState(ad?.image_ref_asset?.url || ad?.image_url || "");
  const [selectedCompanyName, setSelectedCompanyName] = useState(ad?.related_company_featured?.name || "");

  const handleAssetSelect = (assetId: string, assetUrl: string) => {
    setFormData((prev) => ({ ...prev, image_ref: assetId }));
    setSelectedAssetUrl(assetUrl);
  };
  const handleCompanySelect = (companyId: string, companyName: string) => {
    setFormData((prev) => ({ ...prev, related_company: companyId }));
    setSelectedCompanyName(companyName);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <Modal open={isOpen} onClose={onClose} title={ad ? "Edit Ad" : "Create New Ad"} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{ad ? "Edit Ad" : "Create New Ad"}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link URL *</label>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-400" />
            <input type="url" required value={formData.link_url} onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={formData.description || ""} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={3}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select value={formData.location} onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value as BannerLocation }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20">
              <option value="sidebar">Sidebar</option>
              <option value="article_inline">Article Inline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type</label>
            <select value={formData.banner_type} onChange={(e) => setFormData((prev) => ({ ...prev, banner_type: e.target.value as BannerType }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20">
              <option value="square">Square</option>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image (Asset)</label>
          <div className="flex items-center gap-3">
            {selectedAssetUrl && <img src={selectedAssetUrl} alt="Selected" className="w-16 h-16 object-cover rounded border border-gray-200" />}
            <button type="button" onClick={() => onSelectAsset(handleAssetSelect)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
              {selectedAssetUrl ? "Change Asset" : "Select Asset"}
            </button>
            {!formData.image_ref && <span className="text-xs text-gray-500">No asset selected</span>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Related Company</label>
          <div className="flex items-center gap-3">
            {selectedCompanyName && <span className="text-sm text-gray-700">{selectedCompanyName}</span>}
            <button type="button" onClick={() => onSelectCompany(handleCompanySelect)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
              {selectedCompanyName ? "Change Company" : "Select Company"}
            </button>
            {formData.related_company && (
              <button type="button" onClick={() => { setFormData((prev) => ({ ...prev, related_company: "" })); setSelectedCompanyName(""); }}
                className="text-red-500 hover:text-red-700 text-sm">Clear</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Pages (JSON)</label>
            <input type="text" value={formData.target_pages || ""} onChange={(e) => setFormData((prev) => ({ ...prev, target_pages: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" placeholder='["home", "article"]' />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Categories (JSON)</label>
            <input type="text" value={formData.target_categories || ""} onChange={(e) => setFormData((prev) => ({ ...prev, target_categories: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" placeholder='["tech", "business"]' />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" value={formData.display_order} onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Views (0 = unlimited)</label>
            <input type="number" value={formData.max_views} onChange={(e) => setFormData((prev) => ({ ...prev, max_views: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Is Active</label>
            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${formData.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
              {formData.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {formData.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="datetime-local" value={formData.start_date || ""} onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="datetime-local" value={formData.end_date || ""} onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium">
            {ad ? "Update Ad" : "Create Ad"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
