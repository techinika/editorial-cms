"use client";

import Link from "next/link";
import { Home, Search, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-[#3182ce]/10 rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="w-12 h-12 text-[#3182ce]" />
          </div>
          <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3182ce] text-white font-semibold rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            Create Article
          </Link>
        </div>
      </div>
    </div>
  );
}
