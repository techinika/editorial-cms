"use client";

import React from "react";
import { Users, Crown, XCircle, Loader2 } from "lucide-react";
import { ArticleContributor } from "@/types/article";
import { JoinedArticle } from "@/types/article";

interface TeamPanelProps {
  isOwner: boolean;
  isAdmin: boolean;
  article?: JoinedArticle;
  contributors: ArticleContributor[];
  allAuthors: { id: string; name: string; image_url: string | null }[];
  selectedOwnerId: string | null;
  setSelectedOwnerId: (id: string | null) => void;
  isUpdatingOwner: boolean;
  handleChangeOwner: () => void;
  handleAddContributor: (authorId: string) => void;
  handleRemoveContributor: (contributorId: string) => void;
}

export default function TeamPanel({
  isOwner,
  isAdmin,
  article,
  contributors,
  allAuthors,
  selectedOwnerId,
  setSelectedOwnerId,
  isUpdatingOwner,
  handleChangeOwner,
  handleAddContributor,
  handleRemoveContributor,
}: TeamPanelProps) {
  return (
    <aside className="w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team Management
        </h3>
      </div>

      {/* Writer Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">Writer</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
          {article?.author?.image_url ? (
            <img
              src={article.author.image_url}
              alt={article.author.name || "Writer"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-sm">
              {(article?.author?.name || "W").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {article?.author?.name || "Unknown"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-3">
            <select
              value={selectedOwnerId || ""}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            >
              <option value="">Change writer...</option>
              {allAuthors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
            {selectedOwnerId && selectedOwnerId !== article?.author?.id && (
              <button
                onClick={handleChangeOwner}
                disabled={isUpdatingOwner}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isUpdatingOwner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                Change Writer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contributors */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#3182ce]" />
          <span className="text-sm font-medium text-gray-700">
            Contributors
          </span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {contributors.length === 0 ? (
            <p className="text-xs text-gray-500">No contributors yet</p>
          ) : (
            contributors.map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
              >
                {contributor.author?.image_url ? (
                  <img
                    src={contributor.author.image_url}
                    alt={contributor.author.name || "Contributor"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">
                    {(contributor.author?.name || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {contributor.author?.name || "Unknown"}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveContributor(contributor.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {isAdmin && (
          <div className="mt-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddContributor(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              defaultValue=""
            >
              <option value="" disabled>
                Add contributor...
              </option>
              {allAuthors
                .filter(
                  (a) =>
                    a.id !== article?.author?.id &&
                    !contributors.some((c) => c.author_id === a.id),
                )
                .map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Read-only info for non-admin */}
      {!isAdmin && (
        <div className="p-4">
          <p className="text-xs text-gray-500">
            Only admins can change the writer or manage contributors.
          </p>
        </div>
      )}
    </aside>
  );
}
