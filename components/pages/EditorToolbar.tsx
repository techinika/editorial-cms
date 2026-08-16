"use client";

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor;
  isRefining: boolean;
  onRefine: () => void;
}

export default function EditorToolbar({ editor, isRefining, onRefine }: EditorToolbarProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().toggleBold().run()}
        className={`p-1.5 rounded ${editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().toggleItalic().run()}
        className={`p-1.5 rounded ${editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().toggleUnderline().run()}
        className={`p-1.5 rounded ${editor.isActive("underline") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().toggleStrike().run()}
        className={`p-1.5 rounded ${editor.isActive("strike") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <s>S</s>
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().setParagraph().run()}
        className={`p-1.5 rounded ${editor.isActive("paragraph") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        P
      </button>
      <button
        type="button"
        onClick={() => editor.chain().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        H2
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) editor.chain().setLink({ href: url }).run();
        }}
        className={`p-1.5 rounded ${editor.isActive("link") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        Link
      </button>
      <button
        type="button"
        onClick={() => editor.chain().unsetLink().run()}
        className="p-1.5 rounded hover:bg-gray-100"
      >
        Unlink
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={onRefine}
        disabled={isRefining}
        className="flex items-center gap-1 p-1.5 rounded hover:bg-purple-100 text-purple-600 disabled:opacity-50"
        title="Refine with AI"
      >
        {isRefining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">AI Refine</span>
      </button>
    </div>
  );
}
