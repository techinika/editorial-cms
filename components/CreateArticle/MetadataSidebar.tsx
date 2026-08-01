"use client";

import React, { useState, useEffect } from "react";
import { ImageIcon, Loader2, X, AlertCircle } from "lucide-react";
import { Category } from "@/types/category";
import { Metadata } from "./useArticleEditor";

interface MetadataSidebarProps {
  metadata: Metadata;
  setMetadata: React.Dispatch<React.SetStateAction<Metadata>>;
  categories: Category[];
  uploadingImage: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  allAuthors: { id: string; name: string; image_url: string | null }[];
  selectedOwnerId: string | null;
  setSelectedOwnerId: (id: string | null) => void;
  authUser: any;
  setShowAssetModal: (show: boolean) => void;
  removeThumbnail: () => void;
}

export default function MetadataSidebar({
  metadata, setMetadata, categories, uploadingImage, isOwner, isAdmin,
  allAuthors, selectedOwnerId, setSelectedOwnerId, authUser,
  setShowAssetModal, removeThumbnail,
}: MetadataSidebarProps) {
  if (!isOwner) {
    return (
      <aside className="w-80 shadow bg-white/50 backdrop-blur-sm p-6 overflow-y-auto space-y-6">
        <div className="space-y-6">
          {isAdmin && allAuthors.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Writer</label>
              <select value={selectedOwnerId || ""} onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all">
                {allAuthors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
              </select>
            </div>
          )}
          {!isAdmin && authUser?.user && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Writer</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                  {(authUser.user.user_metadata.full_name || authUser.user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{authUser.user.user_metadata.full_name || authUser.user.email}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 shadow bg-white/50 backdrop-blur-sm p-6 overflow-y-auto space-y-6">
      {/* Thumbnail */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured Image</label>
        <div className="relative w-full h-36 bg-gradient-to-br from-gray-100 to-gray-50 rounded-md border-2 border-dashed border-gray-200 group overflow-hidden">
          {metadata.image ? (
            <>
              <img src={metadata.image || ""} className="w-full h-full object-cover" alt="Thumbnail" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                <button onClick={() => setShowAssetModal(true)} className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md cursor-pointer hover:bg-gray-100">Change</button>
                <button onClick={removeThumbnail} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><X className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <button onClick={() => setShowAssetModal(true)} className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
              {uploadingImage ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <><ImageIcon className="w-6 h-6 text-gray-300 mb-2" /><span className="text-gray-400 text-sm font-medium">Add Image</span></>}
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
        <select value={metadata.category_id} onChange={(e) => setMetadata((prev) => ({ ...prev, category_id: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all">
          <option value="">Select Category</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* Read Time */}
      <ReadTimeField value={metadata.readTime} onChange={(v) => setMetadata((prev) => ({ ...prev, readTime: v }))} />

      {/* Tags */}
      <InputField label="Tags" value={metadata.tags} onChange={(v) => setMetadata((prev) => ({ ...prev, tags: v }))} placeholder="React, Next.js, TypeScript" />

      {/* SEO Description */}
      <InputField label="SEO Description" value={metadata.seoDescription} onChange={(v) => setMetadata((prev) => ({ ...prev, seoDescription: v }))} placeholder="Meta description for search engines..." multiline />

      {/* Sponsored */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sponsored Article</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMetadata((prev) => ({ ...prev, sponsored: !prev.sponsored }))}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${metadata.sponsored ? "bg-[#3182ce]" : "bg-gray-300"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${metadata.sponsored ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className="text-sm text-gray-700">{metadata.sponsored ? "Yes, this is a sponsored article" : "No, this is not sponsored"}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-amber-700">Keep your SEO description under 160 characters for best results.</p>
          <p className="text-xs text-amber-600 mt-1">{metadata.seoDescription.length}/160 characters</p>
        </div>
      </div>
    </aside>
  );
}

function ReadTimeField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const parsed = Number(text);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Read Time</label>
      <input
        type="number"
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw !== "" && !Number.isNaN(Number(raw))) onChange(Number(raw));
        }}
        onBlur={() => {
          if (text === "" || Number.isNaN(parsed)) setText(String(value));
        }}
        placeholder="Minutes"
        min={0}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all duration-200"
      />
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, multiline = false, required = false }: {
  label: string; value: string | number; onChange: (value: string) => void; type?: string;
  placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all duration-200 resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all duration-200" />
      )}
    </div>
  );
}
