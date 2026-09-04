"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Quote, Code, Link as LinkIcon, Undo, Redo,
  ImagePlus, Video, Loader2, Check, Sparkles,
} from "lucide-react";

const PRIMARY_COLOR = "#3182ce";

function ToolbarButton({ onClick, isActive, children, title, disabled }: {
  onClick: () => void; isActive?: boolean; children: React.ReactNode; title?: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`p-1.5 rounded-md transition-all duration-200 ${
        isActive ? "bg-[#3182ce]/10 text-[#3182ce]" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={isActive ? { backgroundColor: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR } : undefined}
    >
      {children}
    </button>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  uploadingEditorImage: boolean;
  showImageOptions: boolean;
  showVideoOptions: boolean;
  showLinkInput: boolean;
  linkUrl: string;
  onLinkUrlChange: (url: string) => void;
  onSetLink: () => void;
  onToggleLinkInput: () => void;
  onToggleImageOptions: () => void;
  onToggleVideoOptions: () => void;
  onUploadImage: () => void;
  onUploadVideo: () => void;
  onInlineImageSelect: () => void;
  onInlineVideoSelect: () => void;
  onOpenAIArticleModal: () => void;
}

export default function EditorToolbar({
  editor, uploadingEditorImage, showImageOptions, showVideoOptions,
  showLinkInput, linkUrl, onLinkUrlChange, onSetLink, onToggleLinkInput,
  onToggleImageOptions, onToggleVideoOptions,
  onUploadImage, onUploadVideo, onInlineImageSelect, onInlineVideoSelect,
  onOpenAIArticleModal,
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center justify-center py-2 bg-white border-b border-gray-200/60">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50/80 rounded-md border border-gray-200/50">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline"><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List"><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote"><Quote className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="Code Block"><Code className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                onToggleLinkInput();
              }
            }}
            isActive={editor.isActive("link")}
            title={editor.isActive("link") ? "Remove Link" : "Add Link"}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {showLinkInput && (
            <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 p-2 z-50 min-w-[280px]">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => onLinkUrlChange(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSetLink();
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={onSetLink} className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply</button>
                <button onClick={onToggleLinkInput} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolbarButton onClick={onToggleImageOptions} title="Add Image" disabled={uploadingEditorImage}>
            {uploadingEditorImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          </ToolbarButton>
          {showImageOptions && (
            <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]">
              <button onClick={onUploadImage} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Upload New</button>
              <button onClick={onInlineImageSelect} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Choose Existing</button>
            </div>
          )}
        </div>

        {/* Video */}
        <div className="relative">
          <ToolbarButton onClick={onToggleVideoOptions} title="Add Video" disabled={uploadingEditorImage}>
            {uploadingEditorImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          </ToolbarButton>
          {showVideoOptions && (
            <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]">
              <button onClick={onUploadVideo} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Video className="w-4 h-4" /> Upload New</button>
              <button onClick={onInlineVideoSelect} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Video className="w-4 h-4" /> Choose Existing</button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={onOpenAIArticleModal}
          title="Generate a full article from source material"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 bg-[#3182ce]/10 text-[#3182ce] hover:bg-[#3182ce]/15 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
      </div>
    </div>
  );
}
