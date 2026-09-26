"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import { useToast } from "@/components/Toast";
import PartnerForm from "@/components/partners/PartnerForm";
import type { Partner, PartnerInput } from "@/types/idea";
import type { AuthResult } from "@/lib/auth";

interface PartnersPageProps {
  user?: AuthResult;
}

/**
 * Partner management — admin only.
 *
 * Deactivating keeps a partner on the articles they were involved in; deleting
 * removes the partner and leaves those articles with no partner set.
 */
export default function PartnersPage({ user }: PartnersPageProps) {
  const { showToast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/partners?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          showToast("error", "You are not allowed to manage partners");
        }
        return;
      }
      const data = await res.json();
      setPartners(data.partners ?? []);
    } catch (error) {
      console.error("Failed to load partners:", error);
      showToast("error", "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (input: PartnerInput) => {
      setSaving(true);
      try {
        const res = await fetch(
          editing ? `/api/partners/${editing.id}` : "/api/partners",
          {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Failed to save the partner");
          return { ok: false as const, errors: (data.details ?? null) as Record<string, string> | null };
        }
        showToast("success", editing ? "Partner updated" : "Partner added");
        load();
        return { ok: true as const, errors: null };
      } catch (error) {
        console.error("Failed to save partner:", error);
        showToast("error", "Failed to save the partner");
        return { ok: false as const, errors: null };
      } finally {
        setSaving(false);
      }
    },
    [editing, showToast, load]
  );

  const toggleActive = async (partner: Partner) => {
    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !partner.is_active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", data.error || "Failed to update the partner");
        return;
      }
      load();
    } catch (error) {
      console.error("Failed to toggle partner:", error);
      showToast("error", "Failed to update the partner");
    }
  };

  const remove = async (partner: Partner) => {
    const message = partner.article_count
      ? `Delete ${partner.name}? Their ${partner.article_count} article(s) will be kept but no longer linked to a partner.`
      : `Delete ${partner.name}? This cannot be undone.`;
    if (!window.confirm(message)) return;
    try {
      const res = await fetch(`/api/partners/${partner.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", data.error || "Failed to delete the partner");
        return;
      }
      showToast("success", "Partner deleted");
      load();
    } catch (error) {
      console.error("Failed to delete partner:", error);
      showToast("error", "Failed to delete the partner");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar user={user} title="Partners" />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Partners
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Sponsors, clients and sources of commissioned content
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add partner
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading partners…</div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {search ? "No partners match that search." : "No partners yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {partners.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      /{p.slug}
                    </span>
                    {!p.is_active && (
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500">
                      {p.article_count ?? 0} article{(p.article_count ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-600">{p.description}</p>
                  )}
                  {(p.contact_name || p.contact_email) && (
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {[p.contact_name, p.contact_email].filter(Boolean).join(" — ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                      title={p.website}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className="rounded px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(p); setShowForm(true); }}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PartnerForm
        open={showForm}
        onClose={() => setShowForm(false)}
        partner={editing}
        saving={saving}
        onSubmit={save}
      />
    </div>
  );
}
