"use client";

import Link from "next/link";
import { FileText, Mail, Phone, User } from "lucide-react";
import {
  CONTENT_TYPE_LABELS,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_STYLES,
} from "@/lib/idea";
import type { ArticleIdea, AssignableAuthor } from "@/types/idea";

interface IdeaCardProps {
  idea: ArticleIdea;
  authorById: Map<string, AssignableAuthor>;
  /** The signed-in user, to decide whether the Convert action is offered. */
  currentUserId: string | null;
  isAdmin: boolean;
  onEdit: (idea: ArticleIdea) => void;
  onConvert: (idea: ArticleIdea) => void;
  onDelete: (idea: ArticleIdea) => void;
  converting?: boolean;
}

export default function IdeaCard({
  idea,
  authorById,
  currentUserId,
  isAdmin,
  onEdit,
  onConvert,
  onDelete,
  converting = false,
}: IdeaCardProps) {
  const assignee = idea.assigned_author_id
    ? authorById.get(idea.assigned_author_id) ?? idea.assigned_author
    : null;

  // The author who owns the pitch may turn it into an article. Admins can do it
  // for them — the draft still belongs to the assignee either way.
  const isAssignee = Boolean(currentUserId) && idea.assigned_author_id === currentUserId;
  const canConvert = !idea.article_id && Boolean(idea.assigned_author_id) && (isAssignee || isAdmin);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300 hover:shadow">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{idea.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            IDEA_STATUS_STYLES[idea.status]
          }`}
        >
          {IDEA_STATUS_LABELS[idea.status]}
        </span>
      </div>

      {idea.concept && (
        <p className="mb-2 line-clamp-3 text-xs text-gray-600">{idea.concept}</p>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            idea.content_type === "commercial"
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
          }`}
        >
          {CONTENT_TYPE_LABELS[idea.content_type]}
        </span>
        {idea.partner && (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-200">
            {idea.partner.name}
          </span>
        )}
      </div>

      <div className="mb-2 space-y-1 text-[11px] text-gray-500">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600">
            <User className="h-3 w-3 shrink-0" />
            <span>Unassigned</span>
          </div>
        )}
        {idea.lead_name && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">Lead: {idea.lead_name}</span>
          </div>
        )}
        {idea.contact_email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0" />
            <a
              href={`mailto:${idea.contact_email}`}
              className="truncate text-blue-600 hover:underline"
            >
              {idea.contact_email}
            </a>
          </div>
        )}
        {idea.contact_phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{idea.contact_phone}</span>
          </div>
        )}
      </div>

      {idea.article && (
        <Link
          href={`/edit/${idea.article.id}`}
          className="mb-2 flex items-center gap-1.5 rounded bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100"
        >
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">Open article: {idea.article.title}</span>
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
        <button
          type="button"
          onClick={() => onEdit(idea)}
          className="rounded px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
        >
          {isAdmin ? "Edit" : "Details"}
        </button>

        {canConvert && (
          <button
            type="button"
            onClick={() => onConvert(idea)}
            disabled={converting}
            className="rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {converting ? "Creating…" : "Turn into article"}
          </button>
        )}

        {!idea.article_id && !idea.assigned_author_id && (
          <span className="text-[10px] text-amber-600">
            Assign an author to convert
          </span>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(idea)}
            className="ml-auto rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
