"use client";

import React from "react";

export function KPICard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${bg} rounded-md`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      {icon}
      <p className="mt-4">{message}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
      status === "published" ? "bg-green-100 text-green-700"
      : status === "draft" ? "bg-yellow-100 text-yellow-700"
      : status === "cancelled" ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700"
    }`}>
      {status}
    </span>
  );
}
