"use client";

import React from "react";
import {
  FileText,
  Share2,
  Trash2,
  Edit2,
  EyeOff,
  Check,
  Bell,
} from "lucide-react";
import { JoinedArticle, ArticlePendingActivity } from "@/types/article";

interface ArticleCardProps {
  article: JoinedArticle;
  onShare: (article: JoinedArticle) => void;
  onEdit: (articleId: string) => void;
  onUnpublish: (article: JoinedArticle) => void;
  onDelete: (article: JoinedArticle) => void;
  copiedId: string | null;
  activity?: ArticlePendingActivity;
}

export default function ArticleCard({
  article,
  onShare,
  onEdit,
  onUnpublish,
  onDelete,
  copiedId,
  activity,
}: ArticleCardProps) {
  const hasActivity =
    activity &&
    (activity.unresolvedFeedback > 0 || activity.unreadComments > 0);
  const totalActivity = activity
    ? activity.unresolvedFeedback + activity.unreadComments
    : 0;

  return (
    <div className="group cursor-pointer">
      <div className="aspect-[3/4] bg-white border border-gray-200 rounded-lg overflow-hidden group-hover:border-[#3182ce] transition-all relative">
        {article.image || article.thumbnailAsset?.url ? (
          <img
            src={article.thumbnailAsset?.url || article.image || ""}
            alt={article.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent" />
        {article.status && (
          <span
            className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded ${
              article.status === "published"
                ? "bg-green-100 text-green-700"
                : article.status === "draft"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {article.status}
          </span>
        )}

        {hasActivity && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
            <Bell className="w-3 h-3" />
            {totalActivity}
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(article);
              }}
              className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
              title="Copy link"
            >
              {copiedId === article.id ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(article.id);
              }}
              className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {article.status === "published" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpublish(article);
                }}
                className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 shadow-sm"
                title="Unpublish"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(article);
              }}
              className="p-1.5 bg-white/90 rounded-md hover:bg-white text-red-600 shadow-sm"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-900 truncate w-full leading-tight">
          {article.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <FileText className="w-3 h-3 text-[#3182ce]" />
            {article.category?.name || "Uncategorized"}
          </p>
          {article.author && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="truncate max-w-[80px]">
                {article.author.name}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
