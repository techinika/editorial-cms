"use client";

import React from "react";
import { Sparkles, Check, X, Building2, Loader2 } from "lucide-react";
import { CompanySuggestion } from "@/types/article-company";

interface SuggestionsListProps {
  suggestions: CompanySuggestion[];
  confirmingIds: string[];
  onConfirm: (suggestion: CompanySuggestion) => void;
  onDismiss: (companyId: string) => void;
  onConfirmAll: () => void;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 75) return "bg-green-500";
  if (confidence >= 55) return "bg-amber-500";
  return "bg-gray-400";
}

export default function SuggestionsList({
  suggestions,
  confirmingIds,
  onConfirm,
  onDismiss,
  onConfirmAll,
}: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  const pendingCount = suggestions.filter(
    (s) => !confirmingIds.includes(s.company_id)
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Suggestions ({pendingCount})
        </h3>
        {pendingCount > 1 && (
          <button
            type="button"
            onClick={onConfirmAll}
            disabled={confirmingIds.length > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-xs font-medium disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.company_id}
            className={`p-3 border rounded-md transition-opacity ${
              confirmingIds.includes(suggestion.company_id)
                ? "bg-green-50 border-green-200 opacity-70"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.name || suggestion.company_id}
                  </p>
                  <span
                    className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${confidenceColor(
                      suggestion.confidence
                    )}`}
                  >
                    {suggestion.confidence}%
                  </span>
                </div>
                {suggestion.reason && (
                  <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                )}
              </div>
              {!confirmingIds.includes(suggestion.company_id) && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onConfirm(suggestion)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Create match"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(suggestion.company_id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {confirmingIds.includes(suggestion.company_id) && (
                <Loader2 className="w-4 h-4 animate-spin text-green-600 flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
