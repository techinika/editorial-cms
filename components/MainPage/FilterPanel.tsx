"use client";

import React from "react";
import { Filter, X } from "lucide-react";
import { Category } from "@/types/category";

interface FilterPanelProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: Category[];
  onClearFilters: () => void;
}

export default function FilterPanel({
  showFilters,
  setShowFilters,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  onClearFilters,
}: FilterPanelProps) {
  const hasActiveFilters = statusFilter || categoryFilter;

  return (
    <>
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-[#3182ce] text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            {statusFilter && (
              <span className="px-3 py-1 bg-[#3182ce]/10 text-[#3182ce] text-sm rounded-md">
                Status: {statusFilter}
              </span>
            )}
            {categoryFilter && (
              <span className="px-3 py-1 bg-[#3182ce]/10 text-[#3182ce] text-sm rounded-md">
                Category:{" "}
                {categories.find((c) => c.id === categoryFilter)?.name ||
                  categoryFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
