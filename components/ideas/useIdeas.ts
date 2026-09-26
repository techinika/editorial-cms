"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import type {
  ArticleIdea,
  ArticleIdeaInput,
  AssignableAuthor,
  IdeaStatus,
  Partner,
} from "@/types/idea";

/**
 * Data layer for the ideas board.
 *
 * Everything goes through the admin-only API routes — there is no client-side
 * Supabase read here, because `article_ideas` is service-role only. The author
 * reference data (assignable authors, active partners) comes back from
 * `?meta=1` in the same round trip as the first list request, so the board is
 * usable immediately.
 */

export interface IdeasMeta {
  authors: AssignableAuthor[];
  partners: Partner[];
}

export interface UseIdeasOptions {
  /** Only fetch this author's ideas, and hide everything else. */
  restrictToAuthorId?: string | null;
  initialStatus?: IdeaStatus | "all";
}

export function useIdeas({ restrictToAuthorId, initialStatus = "all" }: UseIdeasOptions = {}) {
  const { showToast } = useToast();

  const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
  const [meta, setMeta] = useState<IdeasMeta>({ authors: [], partners: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IdeaStatus | "all">(initialStatus);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      if (unassignedOnly) params.set("unassigned", "1");
      if (restrictToAuthorId) params.set("assignedTo", restrictToAuthorId);
      params.set("pageSize", "200");

      const res = await fetch(`/api/ideas?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          showToast("error", "You are not allowed to view editorial ideas");
        }
        return;
      }
      const data = await res.json();
      setIdeas(data.ideas ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Failed to load ideas:", error);
      showToast("error", "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }, [search, status, unassignedOnly, restrictToAuthorId, showToast]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas?meta=1");
      if (!res.ok) return;
      const data = await res.json();
      setMeta({ authors: data.authors ?? [], partners: data.partners ?? [] });
    } catch (error) {
      console.error("Failed to load idea reference data:", error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const create = useCallback(
    async (input: ArticleIdeaInput) => {
      setSaving(true);
      try {
        const res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Failed to save the idea");
          return { ok: false as const, errors: data.details ?? null };
        }
        setIdeas((prev) => [data.idea, ...prev]);
        showToast("success", "Idea saved");
        return { ok: true as const, errors: null };
      } catch (error) {
        console.error("Failed to create idea:", error);
        showToast("error", "Failed to save the idea");
        return { ok: false as const, errors: null };
      } finally {
        setSaving(false);
      }
    },
    [showToast],
  );

  const update = useCallback(
    async (id: string, patch: Partial<ArticleIdeaInput>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/ideas/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Failed to update the idea");
          return { ok: false as const, errors: data.details ?? null };
        }
        setIdeas((prev) => prev.map((i) => (i.id === id ? data.idea : i)));
        return { ok: true as const, errors: null };
      } catch (error) {
        console.error("Failed to update idea:", error);
        showToast("error", "Failed to update the idea");
        return { ok: false as const, errors: null };
      } finally {
        setSaving(false);
      }
    },
    [showToast],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast("error", data.error || "Failed to delete the idea");
          return false;
        }
        setIdeas((prev) => prev.filter((i) => i.id !== id));
        showToast("success", "Idea deleted");
        return true;
      } catch (error) {
        console.error("Failed to delete idea:", error);
        showToast("error", "Failed to delete the idea");
        return false;
      }
    },
    [showToast],
  );

  /**
   * Turns an idea into a real draft. The API returns the new article, so the
   * caller can offer a link straight to the editor.
   */
  const convert = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ideas/${id}/convert`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Could not create the article");
          return { ok: false as const, article: null };
        }
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...data.idea } : i))
        );
        showToast("success", "Draft article created");
        return { ok: true as const, article: data.article };
      } catch (error) {
        console.error("Failed to convert idea:", error);
        showToast("error", "Could not create the article");
        return { ok: false as const, article: null };
      }
    },
    [showToast],
  );

  /** Groups the flat list into pipeline columns for the board. */
  const board = useMemo(() => {
    const columns = new Map<IdeaStatus, ArticleIdea[]>();
    for (const idea of ideas) {
      const list = columns.get(idea.status) ?? [];
      list.push(idea);
      columns.set(idea.status, list);
    }
    return columns;
  }, [ideas]);

  const authorById = useMemo(() => {
    const map = new Map<string, AssignableAuthor>();
    for (const a of meta.authors) map.set(a.id, a);
    return map;
  }, [meta.authors]);

  return {
    ideas,
    board,
    total,
    loading,
    saving,
    meta,
    authorById,
    search,
    setSearch,
    status,
    setStatus,
    unassignedOnly,
    setUnassignedOnly,
    load,
    create,
    update,
    remove,
    convert,
  };
}

export type UseIdeasReturn = ReturnType<typeof useIdeas>;
