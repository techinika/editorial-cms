"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Link2,
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  Building2,
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import CompanySearchInput from "@/components/companies/CompanySearchInput";
import ArticleSelector from "@/components/article-matches/ArticleSelector";
import ExistingMatches from "@/components/article-matches/ExistingMatches";
import SuggestionsList from "@/components/article-matches/SuggestionsList";
import BatchMatches from "@/components/article-matches/BatchMatches";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";
import {
  getArticleCompanyMatches,
  createArticleCompanyMatch,
  deleteArticleCompanyMatch,
} from "@/supabase/CRUD/queries";
import {
  ArticleCompanyMatch,
  CompanySuggestion,
} from "@/types/article-company";

interface SelectedArticle {
  id: string;
  title: string;
  slug: string;
}

interface ArticleMatchesPageProps {
  user?: AuthResult;
}

export default function ArticleMatchesPage({ user }: ArticleMatchesPageProps) {
  const { showToast } = useToast();

  const [selectedArticle, setSelectedArticle] = useState<SelectedArticle | null>(null);
  const [matches, setMatches] = useState<ArticleCompanyMatch[]>([]);
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState<number[]>([]);
  const [confirmingIds, setConfirmingIds] = useState<string[]>([]);

  const loadMatches = async (articleId: string) => {
    setMatchesLoading(true);
    const data = await getArticleCompanyMatches(articleId);
    setMatches(data);
    setMatchesLoading(false);
  };

  const handleSelectArticle = async (article: SelectedArticle | null) => {
    setSelectedArticle(article);
    setSuggestions([]);
    if (article) {
      await loadMatches(article.id);
    } else {
      setMatches([]);
    }
  };

  const handleFindWithAi = async () => {
    if (!selectedArticle) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/match-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: selectedArticle.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "AI matching failed");
        return;
      }

      const matchedIds = new Set(matches.map((m) => m.company_id));
      const fresh: CompanySuggestion[] = (data.matches || []).filter(
        (s: CompanySuggestion) => !matchedIds.has(s.company_id)
      );

      setSuggestions(fresh);

      if (fresh.length === 0) {
        showToast("info", "No new company matches found for this article");
      } else {
        showToast("success", `Found ${fresh.length} possible match(es). Review and confirm.`);
      }
    } catch (err) {
      console.error("AI matching error:", err);
      showToast("error", "AI matching failed");
    } finally {
      setAiLoading(false);
    }
  };

  const confirmSuggestion = async (companyId: string) => {
    if (!selectedArticle) return false;
    const success = await createArticleCompanyMatch(selectedArticle.id, companyId);
    if (!success) {
      showToast("error", "Failed to create match");
      return false;
    }
    await loadMatches(selectedArticle.id);
    return true;
  };

  const handleConfirm = async (suggestion: CompanySuggestion) => {
    setConfirmingIds((prev) => [...prev, suggestion.company_id]);
    const success = await confirmSuggestion(suggestion.company_id);
    if (success) {
      setSuggestions((prev) => prev.filter((s) => s.company_id !== suggestion.company_id));
      showToast("success", "Match created");
    }
    setConfirmingIds((prev) => prev.filter((id) => id !== suggestion.company_id));
  };

  const handleConfirmAll = async () => {
    if (!selectedArticle || suggestions.length === 0) return;
    setConfirmingIds(suggestions.map((s) => s.company_id));
    let count = 0;
    for (const s of suggestions) {
      if (await confirmSuggestion(s.company_id)) count++;
    }
    setSuggestions([]);
    setConfirmingIds([]);
    showToast("success", `Created ${count} match(es)`);
  };

  const handleDismiss = (companyId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.company_id !== companyId));
  };

  const handleManualAdd = async (company: { id: string; name: string } | null) => {
    if (!company || !selectedArticle) return;
    const success = await createArticleCompanyMatch(selectedArticle.id, company.id);
    if (success) {
      await loadMatches(selectedArticle.id);
      setSuggestions((prev) => prev.filter((s) => s.company_id !== company.id));
      showToast("success", `Matched to ${company.name}`);
    } else {
      showToast("error", "Failed to create match");
    }
  };

  const handleRemoveMatch = async (matchId: number) => {
    setRemovingIds((prev) => [...prev, matchId]);
    const success = await deleteArticleCompanyMatch(matchId);
    if (success) {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      showToast("success", "Match removed");
    } else {
      showToast("error", "Failed to remove match");
    }
    setRemovingIds((prev) => prev.filter((id) => id !== matchId));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="Article Matches"
        icon={<Link2 className="text-white w-6 h-6" />}
        user={user}
      />

      <main className="max-w-3xl mx-auto p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select an Article</h2>
            <p className="text-xs text-gray-500 mb-4">
              Pick an article, then match it to companies manually or with AI.
            </p>
            <ArticleSelector value={selectedArticle} onChange={handleSelectArticle} />
          </div>

          {!selectedArticle && <BatchMatches />}

          {selectedArticle && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Companies</h2>
                  <button
                    type="button"
                    onClick={handleFindWithAi}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Find matches with AI
                  </button>
                </div>

                {aiLoading && (
                  <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-md">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    <p className="text-sm text-purple-700">
                      Reading the article and comparing companies... this may take a moment.
                    </p>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    <Plus className="w-4 h-4" />
                    Add match manually
                  </label>
                  <CompanySearchInput value={null} onChange={handleManualAdd} />
                </div>

                {matchesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <ExistingMatches
                    matches={matches}
                    onRemove={handleRemoveMatch}
                    removingIds={removingIds}
                  />
                )}

                {!matchesLoading &&
                  matches.length === 0 &&
                  suggestions.length === 0 &&
                  !aiLoading && (
                    <div className="text-center py-6 text-gray-500">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No companies matched yet</p>
                    </div>
                  )}
              </div>

              {(suggestions.length > 0 || confirmingIds.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <SuggestionsList
                    suggestions={suggestions}
                    confirmingIds={confirmingIds}
                    onConfirm={handleConfirm}
                    onDismiss={handleDismiss}
                    onConfirmAll={handleConfirmAll}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
