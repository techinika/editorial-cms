"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";

interface ThumbnailFieldProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  error?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Thumbnail picker: upload a file, or paste a URL.
 *
 * Both paths write the same `videos.thumbnail` column, so a video can be
 * uploaded today and have its image replaced by a hosted URL tomorrow without a
 * migration. The file input is reset after every pick so re-uploading the same
 * filename twice still fires a change event.
 */
export default function ThumbnailField({
  value,
  onChange,
  onUpload,
  uploading,
  error,
}: ThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_BYTES) return;
    onUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-28 h-20 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-xs font-medium disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP, GIF or AVIF up to 5 MB.
          </p>
        </div>
      </div>

      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
