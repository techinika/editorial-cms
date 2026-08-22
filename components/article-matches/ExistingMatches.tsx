"use client";

import React from "react";
import { Building2, X, Link2 } from "lucide-react";
import { ArticleCompanyMatch } from "@/types/article-company";

interface ExistingMatchesProps {
  matches: ArticleCompanyMatch[];
  onRemove: (matchId: number) => void;
  removingIds: number[];
}

export default function ExistingMatches({
  matches,
  onRemove,
  removingIds,
}: ExistingMatchesProps) {
  if (matches.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
        <Link2 className="w-4 h-4 text-[#3182ce]" />
        Matched Companies ({matches.length})
      </h3>
      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
          >
            {match.company?.image?.url ? (
              <img
                src={match.company.image.url}
                alt={match.company.name}
                className="w-9 h-9 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {match.company?.name || "Unknown company"}
              </p>
              {match.company?.industry && (
                <p className="text-xs text-gray-500 truncate">{match.company.industry}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(match.id)}
              disabled={removingIds.includes(match.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Remove match"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
