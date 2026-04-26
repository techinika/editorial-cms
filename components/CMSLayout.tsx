"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, User, LogOut, FileText, Plus, Tag, BarChart3, Clock, MessageSquare } from "lucide-react";
import { AuthResult } from "@/lib/auth";

interface CMSLayoutProps {
  user?: AuthResult;
  children: React.ReactNode;
}

export default function CMSLayout({ user, children }: CMSLayoutProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#3182ce] p-2 rounded-lg">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-medium">Blog CMS</h1>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/create" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Create Article">
            <Plus className="w-5 h-5" />
          </Link>
          
          <Link href="/categories" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Categories">
            <Tag className="w-5 h-5" />
          </Link>
          
          <Link href="/stats" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Stats">
            <BarChart3 className="w-5 h-5" />
          </Link>
          
          <Link href="/pending" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Pending Review">
            <Clock className="w-5 h-5" />
          </Link>
          
          <UserMenu user={user} />
        </div>
      </header>

      {children}
    </div>
  );
}

function UserMenu({ user }: { user?: AuthResult }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  if (!user?.authenticated || !user.user) {
    return (
      <Link
        href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
        className="flex items-center gap-2 px-3 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium"
      >
        Log In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.user.user_metadata.full_name || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-sm font-medium">
            {(
              user.user.user_metadata.full_name ||
              user.user.email ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
            {user.isAdmin && (
              <div className="px-3 py-1 border-b border-gray-100">
                <span className="text-xs text-[#3182ce] font-medium">Admin</span>
              </div>
            )}
            <div className="px-3 py-1 text-xs text-gray-500 truncate">
              {user.user.email}
            </div>
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Account Settings</span>
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/signout?redirect=${typeof window !== "undefined" ? window.location.origin : ""}`}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}