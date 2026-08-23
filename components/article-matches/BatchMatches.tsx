"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  Building2,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { createArticleCompanyMatch } from "@/supabase/CRUD/queries";

interface BatchPair {
  article_id: string;
  article_title: string;
  company_id: string;
  company_name: string;
  confidence: number;
  reason: string;
}

interface CompanyGroup {
  company_id: string;
  company_name: string;
  items: BatchPair[];
}

function confidenceColor(confidence: number): string {
  if (confidence >= 75) return "bg-green-500";
  if (confidence >= 55) return "bg-amber-500";
  return "bg-gray-400";
}

export default function BatchMatches() {
  const { showToast } = useToast();

  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [pairs, setPairs] = useState<BatchPair[]>([]);
  const [confirmingKeys, setConfirmingKeys] = useState<string[]>([]);

  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, CompanyGroup>();
    for (const pair of pairs) {
      let group = map.get(pair.company_id);
      if (!group) {
        group = {
          company_id: pair.company_id,
          company_name: pair.company_name || pair.company_id,
          items: [],
        };
        map.set(pair.company_id, group);
      }
      group.items.push(pair);
    }
    return Array.from(map.values());
  }, [pairs]);

  const pairKey = (p: BatchPair) => `${p.article_id}:${p.company_id}`;

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    try {
      const res = await fetch("/api/match-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "AI batch matching failed");
        return;
      }

      const found: BatchPair[] = data.pairs || [];
      setPairs(found);
      setScanned(true);

      if (found.length === 0) {
        showToast("info", "No new matches found across recent articles");
      } else {
        showToast(
          "success",
          `Found ${found.length} possible match(es). Review and confirm below.`
        );
      }
    } catch (err) {
      console.error("AI batch matching error:", err);
      showToast("error", "AI batch matching failed");
    } finally {
      setScanning(false);
    }
  };

  const createMatch = async (
    articleId: string,
    companyId: string
  ): Promise<boolean> => {
    const success = await createArticleCompanyMatch(articleId, companyId);
    if (!success) showToast("error", "Failed to create match");
    return success;
  };

  const handleConfirm = async (pair: BatchPair) => {
    const key = pairKey(pair);
    setConfirmingKeys((prev) => [...prev, key]);
    if (await createMatch(pair.article_id, pair.company_id)) {
      setPairs((prev) => prev.filter((p) => pairKey(p) !== key));
    }
    setConfirmingKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleConfirmGroup = async (group: CompanyGroup) => {
    const keys = group.items.map(pairKey);
    setConfirmingKeys((prev) => [...prev, ...keys]);
    let count = 0;
    for (const item of group.items) {
      if (await createMatch(item.article_id, item.company_id)) count++;
    }
    setPairs((prev) => prev.filter((p) => !keys.includes(pairKey(p))));
    setConfirmingKeys((prev) => prev.filter((k) => !keys.includes(k)));
    showToast("success", `Created ${count} match(es) for ${group.company_name}`);
  };

  const handleConfirmAll = async () => {
    const keys = pairs.map(pairKey);
    setConfirmingKeys((prev) => [...prev, ...keys]);
    let count = 0;
    for (const pair of pairs) {
      if (await createMatch(pair.article_id, pair.company_id)) count++;
    }
    setPairs([]);
    setConfirmingKeys([]);
    showToast("success", `Created ${count} match(es)`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Match Everything</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Scans the latest published articles against all companies and groups
            suggestions by company.
          </p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Scan all with AI
        </button>
      </div>

      {scanning && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <p className="text-sm text-purple-700">
            Reading articles and comparing companies... this may take a minute.
          </p>
        </div>
      )}

      {!scanning && scanned && groups.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">
          No new matches found.
        </p>
      )}

      {groups.length > 0 && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={confirmingKeys.length > 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm all ({pairs.length})
            </button>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.company_id}
                className="border border-gray-200 rounded-md overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-0">
                    <Building2 className="w-4 h-4 text-[#3182ce] flex-shrink-0" />
                    <span className="truncate">{group.company_name}</span>
                    <span className="text-xs font-normal text-gray-500 flex-shrink-0">
                      ({group.items.length})
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleConfirmGroup(group)}
                    disabled={confirmingKeys.length > 0}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm all
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {group.items.map((pair) => {
                    const key = pairKey(pair);
                    const confirming = confirmingKeys.includes(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-2 px-3 py-2 ${confirming ? "bg-green-50 opacity-70" : ""}`}
                      >
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {pair.article_title || pair.article_id}
                          </p>
                          {pair.reason && (
                            <p className="text-xs text-gray-600 mt-0.5">{pair.reason}</p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full flex-shrink-0 mt-1 ${confidenceColor(
                            pair.confidence
                          )}`}
                        >
                          {pair.confidence}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConfirm(pair)}
                          disabled={confirming}
                          className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Create match"
                        >
                          {confirming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPairs((prev) => prev.filter((p) => pairKey(p) !== key))
                          }
                          disabled={confirming}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
