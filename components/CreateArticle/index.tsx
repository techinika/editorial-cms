"use client";

import React, { useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import {
  ArrowLeft,
  Upload,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  MessageSquare,
  Users,
  Edit2,
  User,
  Check,
} from "lucide-react";
import NextLink from "next/link";
import { ArticleFeedback, ArticleContributor, JoinedArticle } from "@/types/article";
import { AuthResult } from "@/lib/auth";
import { blocksToHtml } from "@/lib/content-parser";
import ConfirmModal from "@/components/ConfirmModal";
import AssetSelectionModal from "@/components/AssetSelectionModal";
import UserNav from "@/components/UserNav";
import { useArticleEditor } from "./useArticleEditor";
import EditorToolbar from "./EditorToolbar";
import MetadataSidebar from "./MetadataSidebar";
import FeedbackPanel from "./FeedbackPanel";
import TeamPanel from "./TeamPanel";
import AssetEditModal from "./AssetEditModal";

const PRIMARY_COLOR = "#3182ce";

interface ArticleEditorProps {
  authUser?: AuthResult;
  article?: JoinedArticle;
  isOwner?: boolean;
  isAdmin?: boolean;
  feedback?: ArticleFeedback[];
  unresolvedCount?: number;
  contributors?: ArticleContributor[];
  allAuthors?: { id: string; name: string; image_url: string | null }[];
  isNewArticle?: boolean;
}

export default function ArticleEditor({
  authUser: initialAuthUser,
  article: initialArticle,
  isOwner: initialIsOwner = true,
  isAdmin: initialIsAdmin = false,
  feedback: initialFeedback = [],
  unresolvedCount: initialUnresolvedCount = 0,
  contributors: initialContributors = [],
  allAuthors: initialAllAuthors = [],
  isNewArticle: initialIsNewArticle = false,
}: ArticleEditorProps) {
  const editor = useArticleEditor({
    authUser: initialAuthUser,
    article: initialArticle,
    isOwner: initialIsOwner,
    isAdmin: initialIsAdmin,
    feedback: initialFeedback,
    unresolvedCount: initialUnresolvedCount,
    contributors: initialContributors,
    allAuthors: initialAllAuthors,
    isNewArticle: initialIsNewArticle,
  });

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) {
        editor.setShowImageOptions(false);
        editor.setShowVideoOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click handler for asset editing
  useEffect(() => {
    const el = editor.editor?.view.dom;
    if (el) el.addEventListener("click", editor.handleAssetClick);
    return () => { if (el) el.removeEventListener("click", editor.handleAssetClick); };
  }, [editor.editor]);

  const wordCount = editor.editor?.getText().split(/\s+/).filter(Boolean).length || 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <NextLink href="/" className="p-2 hover:bg-gray-100 rounded-md transition-colors group">
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </NextLink>
          <div className="flex flex-col">
            {editor.isOwner ? (
              <input
                type="text"
                value={editor.metadata.title}
                onChange={(e) => editor.setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Article Title"
                className="text-xl font-bold text-gray-900 bg-transparent focus:outline-none placeholder-gray-300 w-96"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 w-96 truncate">
                {editor.metadata.title || "Untitled Article"}
              </h1>
            )}
            <span className="text-xs text-gray-400">
              {wordCount} words &bull; {editor.metadata.readTime} min read
              {initialArticle?.author && (
                <span className="ml-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {initialArticle.author.name}
                </span>
              )}
              {!editor.isOwner && (
                <span className="ml-2 text-blue-600 font-medium">&bull; Review Mode</span>
              )}
              {editor.isPublished && (
                <span className="ml-2 text-green-600 font-medium">&bull; Published</span>
              )}
              {editor.isOwner && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="text-xs text-gray-500">Format:</span>
                  <button onClick={() => editor.setArticleFormat("html")}
                    className={`px-2 py-0.5 text-xs rounded ${editor.articleFormat === "html" ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    HTML
                  </button>
                  <button onClick={() => editor.setArticleFormat("blocks")}
                    className={`px-2 py-0.5 text-xs rounded ${editor.articleFormat === "blocks" ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    Blocks
                  </button>
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {editor.isOwner && editor.unresolvedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">
                {editor.unresolvedCount} unresolved feedback
              </span>
            </div>
          )}

          {(editor.isOwner || editor.isAdmin) && (
            <button
              onClick={() => editor.setShowTeamPanel(!editor.showTeamPanel)}
              className={`p-2 rounded-md transition-colors ${editor.showTeamPanel ? "bg-[#3182ce]/10 text-[#3182ce]" : "text-gray-600 hover:bg-gray-100"}`}
              title="Team"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => editor.setShowFeedbackPanel(!editor.showFeedbackPanel)}
            className={`p-2 rounded-md transition-colors relative ${editor.showFeedbackPanel ? "bg-[#3182ce]/10 text-[#3182ce]" : "text-gray-600 hover:bg-gray-100"}`}
            title="Feedback"
          >
            <MessageSquare className="w-4 h-4" />
            {editor.feedback.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {editor.feedback.length}
              </span>
            )}
          </button>

          <button
            onClick={() => editor.setShowPreview(!editor.showPreview)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={editor.showPreview ? "Edit Mode" : "Preview"}
          >
            {editor.showPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {editor.isOwner && (
            <>
              <button onClick={editor.handleSaveDraft} disabled={editor.isSaving}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50" title="Save Draft">
                {editor.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button
                onClick={editor.isPublished ? editor.handleUpdateCheck : editor.handlePublishCheck}
                disabled={editor.isSaving}
                className={`p-2 rounded-md transition-all duration-200 ${editor.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-[#3182ce] hover:bg-[#2c5282] text-white"} disabled:opacity-70`}
                title={editor.isPublished ? "Update" : "Publish"}
                style={editor.isPublished ? {} : { backgroundColor: PRIMARY_COLOR }}
              >
                {editor.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editor.isPublished ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              </button>
            </>
          )}

          <UserNav user={editor.authUser || undefined} />
        </div>
      </header>

      {/* TOOLBAR */}
      {editor.isOwner && (
        <EditorToolbar
          editor={editor.editor}
          uploadingEditorImage={editor.uploadingEditorImage}
          showImageOptions={editor.showImageOptions}
          showVideoOptions={editor.showVideoOptions}
          showLinkInput={editor.showLinkInput}
          linkUrl={editor.linkUrl}
          onLinkUrlChange={editor.setLinkUrl}
          onSetLink={editor.setLink}
          onToggleImageOptions={() => editor.setShowImageOptions(!editor.showImageOptions)}
          onToggleVideoOptions={() => editor.setShowVideoOptions(!editor.showVideoOptions)}
          onUploadImage={editor.handleEditorImageUpload}
          onUploadVideo={editor.handleEditorVideoUpload}
          onInlineImageSelect={editor.handleInlineImageSelect}
          onInlineVideoSelect={editor.handleInlineVideoSelect}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: METADATA */}
        <MetadataSidebar
          metadata={editor.metadata}
          setMetadata={editor.setMetadata}
          categories={editor.categories}
          uploadingImage={editor.uploadingImage}
          isOwner={editor.isOwner}
          isAdmin={editor.isAdmin}
          allAuthors={editor.allAuthors}
          selectedOwnerId={editor.selectedOwnerId}
          setSelectedOwnerId={editor.setSelectedOwnerId}
          authUser={editor.authUser}
          setShowAssetModal={editor.setShowAssetModal}
          removeThumbnail={editor.removeThumbnail}
          isGeneratingSEO={editor.isGeneratingSEO}
          handleGenerateSEO={editor.handleGenerateSEO}
        />

        {/* EDITOR AREA */}
        <main
          className={`flex-1 overflow-y-auto p-8 pb-32 ${editor.showFeedbackPanel && !editor.isOwner ? "pr-80" : ""}`}
        >
          <div className="max-w-3xl mx-auto">
            {editor.showPreview ? (
              <div className="bg-white rounded-md shadow-sm border border-gray-200 p-12 min-h-[500px]">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                  {editor.metadata.title || "Untitled Article"}
                </h1>
                {editor.metadata.image && (
                  <img src={editor.metadata.image || ""} className="w-full h-64 object-cover rounded-md mb-8" alt="Thumbnail" />
                )}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: editor.articleFormat === "blocks" && editor.parsedBlocks.length > 0
                      ? blocksToHtml(editor.parsedBlocks, {})
                      : editor.editor?.getHTML() || ""
                  }}
                />
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-gray-200 rounded-md overflow-hidden">
                {editor.metadata.image && (
                  <div className="relative w-full h-40 bg-gray-50 border-b border-gray-100">
                    <img src={editor.metadata.image || ""} className="w-full h-full object-cover" alt="Thumbnail" />
                  </div>
                )}
                <EditorContent editor={editor.editor} className="min-h-[500px]" />
              </div>
            )}
          </div>
        </main>

        {/* FEEDBACK SIDEBAR */}
        {editor.showFeedbackPanel && (
          <FeedbackPanel
            feedback={editor.feedback}
            unresolvedCount={editor.unresolvedCount}
            newComment={editor.newComment}
            setNewComment={editor.setNewComment}
            isSubmittingComment={editor.isSubmittingComment}
            isOwner={editor.isOwner}
            isGeneratingAI={editor.isGeneratingAI}
            handleSubmitComment={editor.handleSubmitComment}
            handleGenerateAIFeedback={editor.handleGenerateAIFeedback}
            handleResolveFeedback={editor.handleResolveFeedback}
          />
        )}

        {/* TEAM SIDEBAR */}
        {editor.showTeamPanel && (editor.isOwner || editor.isAdmin) && (
          <TeamPanel
            isOwner={editor.isOwner}
            isAdmin={editor.isAdmin}
            article={initialArticle}
            contributors={editor.contributors}
            allAuthors={editor.allAuthors}
            selectedOwnerId={editor.selectedOwnerId}
            setSelectedOwnerId={editor.setSelectedOwnerId}
            isUpdatingOwner={editor.isUpdatingOwner}
            handleChangeOwner={editor.handleChangeOwner}
            handleAddContributor={editor.handleAddContributor}
            handleRemoveContributor={editor.handleRemoveContributor}
          />
        )}
      </div>

      {/* MODALS */}
      <ConfirmModal
        open={editor.showPublishModal}
        onClose={() => editor.setShowPublishModal(false)}
        onConfirm={editor.handlePublish}
        title="Publish Article"
        message={`Are you sure you want to publish "${editor.metadata.title}"?`}
        confirmLabel="Publish"
        type="info"
        loading={editor.isSaving}
      />

      <ConfirmModal
        open={editor.showUpdateModal}
        onClose={() => editor.setShowUpdateModal(false)}
        onConfirm={editor.handleUpdate}
        title="Update Article"
        message={`Are you sure you want to update "${editor.metadata.title}"?`}
        confirmLabel="Update"
        type="info"
        loading={editor.isSaving}
      />

      <AssetSelectionModal
        isOpen={editor.showAssetModal}
        onClose={() => editor.setShowAssetModal(false)}
        onSelect={(asset) => {
          editor.setMetadata((prev) => ({ ...prev, image: asset.url, thumbnail_id: asset.id }));
          editor.setShowAssetModal(false);
        }}
        user={editor.authUser || undefined}
      />

      <AssetSelectionModal
        isOpen={editor.showInlineAssetModal}
        onClose={() => editor.setShowInlineAssetModal(false)}
        onSelect={(asset) => editor.handleExistingAssetSelect(asset.id, asset.url)}
        user={editor.authUser || undefined}
        filterType={editor.inlineAssetType}
      />

      {editor.showAssetEditModal && editor.editingAsset && (
        <AssetEditModal
          editingAsset={editor.editingAsset}
          assetAltText={editor.assetAltText}
          setAssetAltText={editor.setAssetAltText}
          assetCaption={editor.assetCaption}
          setAssetCaption={editor.setAssetCaption}
          handleRemoveAsset={editor.handleRemoveAsset}
          handleSwapAsset={editor.handleSwapAsset}
          updateAssetAltText={editor.updateAssetAltText}
          onClose={() => { editor.setShowAssetEditModal(false); editor.setEditingAsset(null); }}
        />
      )}
    </div>
  );
}
