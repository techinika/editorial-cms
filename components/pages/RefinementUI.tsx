"use client";

import React from "react";
import { CheckCircle, Undo2 } from "lucide-react";

interface RefinementBannerProps {
  type: "subject" | "body";
  content: string;
  onAccept: () => void;
  onRevert: () => void;
}

export function RefinementBanner({ type, content, onAccept, onRevert }: RefinementBannerProps) {
  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
      <span className="text-xs text-purple-600 font-medium">AI suggestion:</span>
      <span className="text-sm text-purple-800 flex-1 truncate">{content}</span>
      <button
        type="button"
        onClick={onAccept}
        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
        title="Accept"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onRevert}
        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
        title="Revert"
      >
        <Undo2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface RefinementBarProps {
  onAccept: () => void;
  onRevert: () => void;
}

export function RefinementBar({ onAccept, onRevert }: RefinementBarProps) {
  return (
    <div className="border-t border-purple-200 bg-purple-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-purple-600 font-medium">
          AI has a suggested refinement for the body
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Accept
          </button>
          <button
            type="button"
            onClick={onRevert}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs font-medium"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Revert
          </button>
        </div>
      </div>
    </div>
  );
}
