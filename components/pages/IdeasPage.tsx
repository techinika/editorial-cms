"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Lightbulb, Plus, Search } from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import { useToast } from "@/components/Toast";
import IdeaCard from "@/components/ideas/IdeaCard";
import IdeaForm from "@/components/ideas/IdeaForm";
import { useIdeas } from "@/components/ideas/useIdeas";
import {
  IDEA_STATUSES,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_STYLES,
  PIPELINE,
  TERMINAL_STATUSES,
} from "@/lib/idea";
import type { ArticleIdea, IdeaStatus } from "@/types/idea";
import type { AuthResult } from "@/lib/auth";

interface IdeasPageProps {
  user?: AuthResult;
}

/**
 * The editorial pipeline: a column per stage, one card per pitch.
 *
 * Admins get the whole board plus assignment and partner management. An author
 * sees only the ideas assigned to them — enough to work a pitch and turn it
 * into a draft, without access to everyone else's leads.
 */
export default function IdeasPage({ user }: IdeasPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isAdmin = Boolean(user?.isAdmin);
  const currentUserId = user?.user?.id ?? null;

  const {
    ideas, board, total, loading, saving, meta, authorById,
    search, setSearch, status, setStatus, unassignedOnly, setUnassignedOnly,
    create, update, remove, convert,
  } = useIdeas({ restrictToAuthorId: isAdmin ? undefined : currentUserId });

  const [editing, setEditing] = useState<ArticleIdea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  const terminal = useMemo(
    () => ideas.filter((i) => TERMINAL_STATUSES.includes(i.status)),
    [ideas]
  );

  const handleConvert = async (idea: ArticleIdea) => {
    setConvertingId(idea.id);
    const result = await convert(idea.id);
    setConvertingId(null);
    if (result.ok && result.article?.id) {
      // Straight into the editor — the draft is seeded with the brief.
      router.push(`/edit/${result.article.id}`);
    }
  };

  const handleDelete = async (idea: ArticleIdea) => {
    const hasArticle = Boolean(idea.article_id);
    const message = hasArticle
      ? `Delete "${idea.title}"? The article it produced will be kept and left unlinked.`
      : `Delete "${idea.title}"? This cannot be undone.`;
    if (!window.confirm(message)) return;
    await remove(idea.id);
  };

  const handleSubmit = async (payload: Parameters<typeof create>[0]) => {
    return editing ? update(editing.id, payload) : create(payload);
  };

  const terminalCount = terminal.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar user={user} title="Editorial ideas" />

      <div className="mx-auto max-w-[1600px] px-4 py-6">
        {/* header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Editorial ideas
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isAdmin
                ? `${total} pitch${total === 1 ? "" : "es"} in the pipeline`
                : "Ideas assigned to you"}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Log idea
            </button>
          )}
        </div>

        {/* filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, briefs and leads"
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IdeaStatus | "all")}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All stages</option>
            {IDEA_STATUSES.map((s) => (
              <option key={s} value={s}>{IDEA_STATUS_LABELS[s]}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setUnassignedOnly((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${
                unassignedOnly
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Unassigned only
            </button>
          )}

          {terminalCount > 0 && (
            <button
              type="button"
              onClick={() => setShowTerminal((v) => !v)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {showTerminal ? "Hide" : "Show"} {terminalCount} published/declined
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading ideas…</div>
        ) : ideas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {isAdmin
                ? "No ideas logged yet. Use “Log idea” to add the first pitch."
                : "No ideas are assigned to you yet."}
            </p>
          </div>
        ) : (
          <>
            {/* pipeline board */}
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
              {PIPELINE.map((stage) => {
                const items = board.get(stage) ?? [];
                return (
                  <div key={stage} className="rounded-lg bg-gray-100 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {IDEA_STATUS_LABELS[stage]}
                      </h2>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-gray-400">Empty</p>
                      ) : (
                        items.map((idea) => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            authorById={authorById}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onEdit={(i) => {
                              if (!isAdmin) {
                                showToast("info", "Only admins can edit ideas");
                                return;
                              }
                              setEditing(i);
                              setShowForm(true);
                            }}
                            onConvert={handleConvert}
                            onDelete={handleDelete}
                            converting={convertingId === idea.id}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* terminal states */}
            {showTerminal && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-700">
                  Published &amp; declined
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {terminal.map((idea) => (
                    <div key={idea.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-900">{idea.title}</h3>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          IDEA_STATUS_STYLES[idea.status as IdeaStatus]
                        }`}>
                          {IDEA_STATUS_LABELS[idea.status as IdeaStatus]}
                        </span>
                      </div>
                      {idea.article && (
                        <a
                          href={`/edit/${idea.article.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {idea.article.title}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isAdmin && (
        <IdeaForm
          open={showForm}
          onClose={() => setShowForm(false)}
          idea={editing}
          authors={meta.authors}
          partners={meta.partners}
          saving={saving}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
