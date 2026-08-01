"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { DailyViews, getViewsByDay } from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";

interface TrendChartProps {
  user?: AuthResult;
}

export default function TrendChart({ user }: TrendChartProps) {
  const [data, setData] = useState<DailyViews[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrend();
  }, [days, user]);

  const loadTrend = async () => {
    if (!user?.user?.id) return;
    setLoading(true);
    const isAdmin = user?.isAdmin;
    const result = await getViewsByDay(days, isAdmin ? null : user.user.id);
    setData(result);
    setLoading(false);
  };

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const totalViews = data.reduce((sum, d) => sum + d.views, 0);
  const totalArticles = data.reduce((sum, d) => sum + d.articles, 0);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Views Trend
        </h2>
        <div className="flex items-center gap-2">
          {([7, 14, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === d
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-md border border-gray-200 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No view data for this period</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Views ({days}d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalArticles}</p>
                <p className="text-xs text-gray-500">Published Articles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {totalArticles ? Math.round(totalViews / totalArticles) : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Views/Article</p>
              </div>
            </div>

            <div className="flex items-end gap-1 h-40">
              {data.map((d) => {
                const height = (d.views / maxViews) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-gray-500">{d.views.toLocaleString()}</span>
                    <div
                      className="w-full bg-[#3182ce] rounded-t-sm min-h-[2px] transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${d.date}: ${d.views} views, ${d.articles} articles`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-400">{data[0]?.date}</span>
              <span className="text-[10px] text-gray-400">{data[data.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
