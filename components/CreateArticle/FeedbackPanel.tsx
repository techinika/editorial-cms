"use client";

import React from "react";
import {
  MessageSquare,
  Loader2,
  Send,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { ArticleFeedback } from "@/types/article";

interface FeedbackPanelProps {
  feedback: ArticleFeedback[];
  unresolvedCount: number;
  newComment: string;
  setNewComment: (value: string) => void;
  isSubmittingComment: boolean;
  isOwner: boolean;
  isGeneratingAI: boolean;
  handleSubmitComment: () => void;
  handleGenerateAIFeedback: () => void;
  handleResolveFeedback: (feedbackId: string) => void;
}

export default function FeedbackPanel({
  feedback,
  unresolvedCount,
  newComment,
  setNewComment,
  isSubmittingComment,
  isOwner,
  isGeneratingAI,
  handleSubmitComment,
  handleGenerateAIFeedback,
  handleResolveFeedback,
}: FeedbackPanelProps) {
  return (
    <aside className="w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Feedback
          {unresolvedCount > 0 && (
            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {unresolvedCount} open
            </span>
          )}
        </h3>
      </div>

      {/* Add Comment Form */}
      <div className="p-4 border-b border-gray-100 space-y-2">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add feedback..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmittingComment}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </button>
          {isOwner && (
            <button
              onClick={handleGenerateAIFeedback}
              disabled={isGeneratingAI}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              title="Generate AI feedback"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI
            </button>
          )}
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto">
        {feedback.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No feedback yet. Be the first to comment!
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {feedback.map((item) => (
              <div
                key={item.id}
                className={`p-4 ${item.resolved ? "bg-green-50/50" : "bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {item.author?.image_url ? (
                      <img
                        src={item.author.image_url}
                        alt={item.author.name || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-sm">
                        {(item.author?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {item.ai_generated
                          ? "AI Reviewer"
                          : item.author?.name || "Unknown"}
                      </span>
                      {item.ai_generated && (
                        <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                      {item.resolved && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {item.feedback_content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {isOwner && !item.resolved && (
                        <button
                          onClick={() => handleResolveFeedback(item.id)}
                          className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
