"use client";

import {
  Edit2,
  ExternalLink,
  Eye,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import { formatDate, formatDuration, isLive } from "@/lib/video";
import type { VideoStatus, VideoWithCategory } from "@/types/video";

const STATUS_STYLES: Record<VideoStatus, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-amber-100 text-amber-800",
};

interface VideoListRowProps {
  video: VideoWithCategory;
  siteUrl: string;
  deleting: boolean;
  onEdit: (video: VideoWithCategory) => void;
  onDelete: (video: VideoWithCategory) => void;
}

export default function VideoListRow({
  video,
  siteUrl,
  deleting,
  onEdit,
  onDelete,
}: VideoListRowProps) {
  const live = isLive(video.status, video.published_at);
  const color = video.video_categories?.color ?? "#3182ce";

  return (
    <div className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50">
      <div className="w-32 h-20 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 relative">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Play className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              STATUS_STYLES[video.status]
            }`}
          >
            {video.status}
          </span>
          {live && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              live
            </span>
          )}
          {video.is_featured && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          )}
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            {video.video_categories?.name ?? "—"}
          </span>
          {video.duration && (
            <span className="text-xs text-gray-500">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>

        <h3 className="font-medium text-gray-900 mt-1 truncate">{video.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{video.summary}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span>{video.provider}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {video.views.toLocaleString()}
          </span>
          <span>·</span>
          {/* A draft has no date at all now — say so rather than printing "—". */}
          <span>
            {video.published_at
              ? `published ${formatDate(video.published_at)}`
              : "not published"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={`${siteUrl}/watch/${video.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on tv.techinika.com"
          className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={() => onEdit(video)}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(video)}
          disabled={deleting}
          className="p-2 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
          title="Delete"
        >
          {deleting ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
