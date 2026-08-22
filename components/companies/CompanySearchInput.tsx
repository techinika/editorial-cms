"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building2, Loader2 } from "lucide-react";
import { CompanyOption } from "@/types/article-company";
import { getCompanies, searchCompanies } from "@/supabase/CRUD/queries";

interface CompanySearchInputProps {
  value: { id: string; name: string } | null;
  onChange: (company: { id: string; name: string } | null) => void;
  placeholder?: string;
}

export default function CompanySearchInput({
  value,
  onChange,
  placeholder = "Search companies by name or description...",
}: CompanySearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchCompanies(query);
      setResults(data);
      setLoading(false);
    }, query ? 300 : 0);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          <Building2 className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{value.name}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Clear company"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-[#3182ce]" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 transition-all"
        />
      </div>

      {loading && (
        <div className="absolute left-3 top-[38px] z-20 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
        </div>
      )}

      {!loading && open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[38px] z-20 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {results.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                onChange({ id: company.id, name: company.name });
                setQuery("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
            >
              {company.image?.url ? (
                <img
                  src={company.image.url}
                  alt={company.name}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                {company.description && (
                  <p className="text-xs text-gray-500 truncate">{company.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && open && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[38px] z-20 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
          No companies found
        </div>
      )}
    </div>
  );
}
