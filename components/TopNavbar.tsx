"use client";

import React from "react";
import Link from "next/link";
import { FileText, Settings } from "lucide-react";
import { AuthResult } from "@/lib/auth";

interface TopNavbarProps {
  title: string;
  icon?: React.ReactNode;
  badge?: { text: string; color?: "blue" | "amber" };
  backHref?: string;
  backIcon?: React.ReactNode;
  center?: React.ReactNode;
  user?: AuthResult;
  actions?: React.ReactNode;
}

export default function TopNavbar({
  title,
  icon,
  badge,
  backHref,
  backIcon,
  center,
  user,
  actions,
}: TopNavbarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {backHref ? (
          <Link
            href={backHref}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            {backIcon || (
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </Link>
        ) : (
          <Link
            href="/"
            className="bg-[#3182ce] p-2 rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <FileText className="text-white w-6 h-6" />
          </Link>
        )}

        {icon && (
          <div className="bg-[#3182ce] p-2 rounded-lg">
            {icon}
          </div>
        )}

        <h1 className="text-xl font-medium">{title}</h1>

        {badge && (
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              badge.color === "amber"
                ? "bg-amber-100 text-amber-700"
                : "bg-[#3182ce]/10 text-[#3182ce]"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {center && (
        <div className="flex-1 max-w-2xl mx-12">{center}</div>
      )}

      <div className="flex items-center gap-2">
        {actions}

        {user?.authenticated && user.user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.user.user_metadata.full_name || "User"}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                  {(
                    user.user.user_metadata.full_name ||
                    user.user.email ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-700 font-medium">
                {user.user.user_metadata.full_name || user.user.email}
              </span>
              {user.isAdmin && (
                <span className="text-xs text-[#3182ce] bg-[#3182ce]/10 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
              className="p-2 text-gray-500 hover:text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors"
              title="Account Settings"
            >
              <Settings className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <a
            href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
            className="px-4 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium"
          >
            Log In
          </a>
        )}
      </div>
    </header>
  );
}
