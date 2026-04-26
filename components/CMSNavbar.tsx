"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, 
  User, 
  LogOut, 
  FileText, 
  Plus, 
  Tag, 
  BarChart3, 
  Clock,
  Settings,
  X
} from "lucide-react";
import { AuthResult } from "@/lib/auth";

interface NavLink {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface CMSNavbarProps {
  user?: AuthResult;
  title?: string;
  showBack?: boolean;
  navLinks?: NavLink[];
}

export default function CMSNavbar({ user, title = "Blog CMS", showBack, navLinks }: CMSNavbarProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const defaultNavLinks: NavLink[] = [
    { href: "/create", icon: <Plus className="w-5 h-5" />, label: "Create" },
    { href: "/categories", icon: <Tag className="w-5 h-5" />, label: "Categories" },
    { href: "/stats", icon: <BarChart3 className="w-5 h-5" />, label: "Stats" },
    { href: "/pending", icon: <Clock className="w-5 h-5" />, label: "Pending" },
  ];

  const links = navLinks || defaultNavLinks;

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => router.back()} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Go Back"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#3182ce] p-1.5 rounded-lg">
            <FileText className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">{title}</h1>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={link.label}
            >
              {link.icon}
              {link.badge !== undefined && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <button 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Plus className="w-5 h-5" />
        </button>

        <UserMenu user={user} />
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-white/95 md:hidden">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({ user }: { user?: AuthResult }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  if (!user?.authenticated || !user.user) {
    return (
      <Link
        href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
        className="px-3 py-1.5 text-sm text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors font-medium"
      >
        Log In
      </Link>
    );
  }

  const userName = user.user.user_metadata?.full_name || user.user.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        title="Menu"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#3182ce] flex items-center justify-center text-white font-medium">
            {userInitial}
          </div>
        )}
      </button>
      
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-sm text-gray-500 truncate">{user.user.email}</p>
            </div>
            
            {user.isAdmin && (
              <div className="px-4 py-1.5 bg-[#3182ce]/10 text-xs text-[#3182ce] font-medium">
                Admin
              </div>
            )}
            
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100"
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </Link>
            
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/signout?redirect=${typeof window !== "undefined" ? window.location.origin : ""}`}
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}