"use client";

import React, { useState } from "react";
import { X, ToggleLeft, ToggleRight } from "lucide-react";
import Modal from "@/components/Modal";
import { TopBanner, TopBannerFormData } from "@/types/top-banner";

interface TopBannerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: TopBanner | null;
  onSave: (formData: TopBannerFormData) => void;
}

export default function TopBannerEditModal({ isOpen, onClose, banner, onSave }: TopBannerEditModalProps) {
  const [formData, setFormData] = useState<TopBannerFormData>({
    title: banner?.title || "",
    content: banner?.content || "",
    link_url: banner?.link_url || "",
    link_text: banner?.link_text || "",
    background_color: banner?.background_color || "#38b6ff",
    text_color: banner?.text_color || "#FFFFFF",
    start_date: banner?.start_date || "",
    end_date: banner?.end_date || "",
    is_active: banner?.is_active ?? true,
    display_order: banner?.display_order ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <Modal open={isOpen} onClose={onClose} title={banner ? "Edit Top Banner" : "Create New Top Banner"} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{banner ? "Edit Top Banner" : "Create New Top Banner"}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea required value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} rows={3}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none" placeholder="Banner text content..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
            <input type="url" value={formData.link_url || ""} onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
            <input type="text" value={formData.link_text || ""} onChange={(e) => setFormData((prev) => ({ ...prev, link_text: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" placeholder="Click here" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={formData.background_color || "#38b6ff"} onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                className="w-10 h-10 border border-gray-200 rounded cursor-pointer" />
              <input type="text" value={formData.background_color || ""} onChange={(e) => setFormData((prev) => ({ ...prev, background_color: e.target.value }))}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={formData.text_color || "#FFFFFF"} onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
                className="w-10 h-10 border border-gray-200 rounded cursor-pointer" />
              <input type="text" value={formData.text_color || ""} onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="datetime-local" required value={formData.start_date} onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input type="datetime-local" required value={formData.end_date} onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input type="number" value={formData.display_order} onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
          <div className="p-4 rounded-lg" style={{ backgroundColor: formData.background_color || "#38b6ff", color: formData.text_color || "#FFFFFF" }}>
            <p className="font-medium">{formData.title}</p>
            <p className="text-sm mt-1">{formData.content}</p>
            {formData.link_url && (
              <a href="#" className="inline-block mt-2 text-sm underline" style={{ color: formData.text_color || "#FFFFFF" }} onClick={(e) => e.preventDefault()}>
                {formData.link_text || "Learn More"}
              </a>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium">
            {banner ? "Update Banner" : "Create Banner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
