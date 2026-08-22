"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Building2, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { FeaturedStartup } from "@/types/user-company";
import { getFeaturedStartups, searchFeaturedStartups } from "@/supabase/CRUD/queries";

interface CompanySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (companyId: string, companyName: string) => void;
}

export default function CompanySelectModal({ isOpen, onClose, onSelect }: CompanySelectModalProps) {
  const [companies, setCompanies] = useState<FeaturedStartup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getFeaturedStartups(0, 50).then((data) => { setCompanies(data); setLoading(false); });
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      const data = await getFeaturedStartups(0, 50);
      setCompanies(data);
      return;
    }
    const results = await searchFeaturedStartups(query);
    setCompanies(results);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Select Company" className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Company</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative group mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
        <input
          type="text"
          placeholder="Search companies..."
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
          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                onClick={() => onSelect(company.id, company.name)}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {company.image?.url ? (
                  <img src={company.image.url} alt={company.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{company.name}</p>
                  {company.description && (
                    <p className="text-xs text-gray-500 truncate">{company.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {companies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No companies found</p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
