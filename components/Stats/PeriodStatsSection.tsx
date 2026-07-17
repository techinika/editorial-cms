"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, ArrowUpRight, Calendar } from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import {
  PeriodStat,
  getArticleCountByPeriod,
  getArticlesByDateRange,
} from "@/supabase/CRUD/queries";
import { JoinedArticle } from "@/types/article";
import { AuthResult } from "@/lib/auth";

type Period = "day" | "week" | "month" | "year";

interface PeriodStatsSectionProps {
  user?: AuthResult;
  onFilteredArticles?: (articles: JoinedArticle[]) => void;
}

function computeRange(date: Date, period: Period): { start: string; end: string } {
  const d = new Date(date);
  const toISO = (dt: Date) => dt.toISOString().split("T")[0] + "T00:00:00.000Z";

  if (period === "day") {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }

  if (period === "week") {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }

  if (period === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }

  // year
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start: toISO(start), end: toISO(end) };
}

function formatDateLabel(date: Date, period: Period): string {
  const opts: Intl.DateTimeFormatOptions =
    period === "day" ? { weekday: "short", month: "short", day: "numeric", year: "numeric" }
    : period === "week" ? { month: "short", day: "numeric", year: "numeric" }
    : period === "month" ? { month: "long", year: "numeric" }
    : { year: "numeric" };
  return date.toLocaleDateString("en-US", opts);
}

export default function PeriodStatsSection({ user, onFilteredArticles }: PeriodStatsSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [periodStats, setPeriodStats] = useState<PeriodStat[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<JoinedArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, user]);

  useEffect(() => {
    loadFilteredArticles();
  }, [selectedDate, selectedPeriod, user]);

  const loadStats = async () => {
    if (!user?.user?.id) return;
    const isAdmin = user?.isAdmin;
    const data = await getArticleCountByPeriod(isAdmin ? null : user.user.id, selectedPeriod);
    setPeriodStats(data);
  };

  const loadFilteredArticles = async () => {
    if (!user?.user?.id) return;
    setLoading(true);
    try {
      const isAdmin = user?.isAdmin;
      const { start, end } = computeRange(selectedDate, selectedPeriod);
      const articles = await getArticlesByDateRange(start, end, isAdmin ? null : user.user.id);
      setFilteredArticles(articles);
      onFilteredArticles?.(articles);
    } finally {
      setLoading(false);
    }
  };

  const range = computeRange(selectedDate, selectedPeriod);
  const totalViews = filteredArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const avgViews = filteredArticles.length ? Math.round(totalViews / filteredArticles.length) : 0;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Performance by Period
      </h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Calendar + Period toggles */}
        <div className="flex flex-col gap-4">
          <CalendarPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <div className="flex flex-wrap items-center gap-2">
            {(["day", "week", "month", "year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === p
                    ? "bg-[#3182ce] text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range summary */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDateLabel(selectedDate, selectedPeriod)}</span>
          </div>
        </div>

        {/* Right: Stats + chart */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-3 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No articles found for this period</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{filteredArticles.length}</p>
                  <p className="text-xs text-gray-500">Articles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{avgViews.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Avg Views</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-2 h-40 mb-4">
                {filteredArticles.map((article) => {
                  const maxViews = Math.max(...filteredArticles.map((a) => a.views || 0), 1);
                  const height = ((article.views || 0) / maxViews) * 100;
                  return (
                    <div key={article.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{(article.views || 0).toLocaleString()}</span>
                      <div
                        className="w-full bg-[#3182ce] rounded-t-md min-h-[2px] transition-all"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${article.title}: ${article.views || 0} views`}
                      />
                      <span className="text-[10px] text-gray-400 text-center truncate w-full" title={article.title}>
                        {article.title.length > 12 ? article.title.slice(0, 12) + "..." : article.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-700 truncate max-w-[200px]">{article.title}</td>
                      <td className="py-2 text-right text-gray-700 flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                        {(article.views || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
