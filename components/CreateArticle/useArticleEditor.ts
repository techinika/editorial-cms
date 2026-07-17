"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import {
  createArticle,
  updateArticle,
  getCategories,
} from "@/supabase/CRUD/queries";
import { checkAuthStatus, AuthResult } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { Category } from "@/types/category";
import { JoinedArticle } from "@/types/article";
import { ArticleFeedback } from "@/types/article";
import { ArticleContributor } from "@/types/article";
import {
  addFeedback,
  markFeedbackResolved,
} from "@/app/actions/feedback";
import {
  addArticleContributor,
  removeArticleContributor,
  changeArticleOwner,
  fetchAllAuthors,
} from "@/app/actions/contributors";
import { Block, TOCEntry, convertLegacyContent } from "@/lib/content-parser";

export interface Metadata {
  title: string;
  slug: string;
  seoDescription: string;
  tags: string;
  readTime: number;
  category_id: string;
  image: string | null;
  thumbnail_id: string | null;
  sponsored: boolean;
}

export interface ArticleEditorProps {
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

export function useArticleEditor({
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
  const [metadata, setMetadata] = useState<Metadata>({
    title: initialArticle?.title || "",
    slug: initialArticle?.slug || "",
    seoDescription: initialArticle?.summary || "",
    tags: initialArticle?.tags || "",
    readTime: parseInt(initialArticle?.read_time || "5") || 5,
    category_id: initialArticle?.category?.id || "",
    image: initialArticle?.image || null,
    thumbnail_id: initialArticle?.thumbnail_id || null,
    sponsored: initialArticle?.sponsored || false,
  });
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isPublished, setIsPublished] = useState(initialArticle?.status === "published");
  const [articleId, setArticleId] = useState<string | null>(initialArticle?.id || null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showInlineAssetModal, setShowInlineAssetModal] = useState(false);
  const [inlineAssetType, setInlineAssetType] = useState<"image" | "video">("image");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const [editingAsset, setEditingAsset] = useState<{ type: "image" | "video"; element: any } | null>(null);
  const [assetAltText, setAssetAltText] = useState("");
  const [assetCaption, setAssetCaption] = useState("");
  const [showAssetEditModal, setShowAssetEditModal] = useState(false);
  const [authUser, setAuthUser] = useState<AuthResult | null>(initialAuthUser || null);
  const [isOwner, setIsOwner] = useState(initialIsOwner);
  const [feedback, setFeedback] = useState<ArticleFeedback[]>(initialFeedback);
  const [unresolvedCount, setUnresolvedCount] = useState(initialUnresolvedCount);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(true);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [isNewArticle, setIsNewArticle] = useState(initialIsNewArticle);
  const [contributors, setContributors] = useState<ArticleContributor[]>(initialContributors);
  const [allAuthors, setAllAuthors] = useState<{ id: string; name: string; image_url: string | null }[]>(initialAllAuthors);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(
    initialArticle?.author?.id || (initialAllAuthors.length > 0 ? initialAllAuthors[0].id : null),
  );
  const [isUpdatingOwner, setIsUpdatingOwner] = useState(false);
  const [isAddingContributor, setIsAddingContributor] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [parsedBlocks, setParsedBlocks] = useState<Block[]>([]);
  const [toc, setToc] = useState<TOCEntry[]>([]);
  const [articleFormat, setArticleFormat] = useState<"html" | "blocks">(
    initialArticle?.blocks && initialArticle.blocks.length > 0 ? "blocks" : "html",
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your amazing story..." }),
      Underline,
      Strike,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#3182ce] underline hover:text-[#2c5282] cursor-pointer" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-md max-w-full h-auto" } }),
    ],
    content: initialArticle?.content || "",
    immediatelyRender: false,
    editable: initialIsOwner,
    editorProps: { attributes: { class: "prose prose-lg max-w-none focus:outline-none min-h-[500px] leading-relaxed text-gray-700" } },
    onUpdate: ({ editor }) => {
      if (editor) {
        const html = editor.getHTML();
        const result = convertLegacyContent(html);
        setParsedBlocks(result.blocks);
        setToc(result.toc);
      }
    },
  });

  useEffect(() => {
    if (editor && articleFormat === "blocks") {
      const html = editor.getHTML();
      const result = convertLegacyContent(html);
      setParsedBlocks(result.blocks);
      setToc(result.toc);
    } else {
      setParsedBlocks([]);
      setToc([]);
    }
  }, [articleFormat, editor]);

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length || 0;

  useEffect(() => {
    if (initialAuthUser) {
      setAuthUser(initialAuthUser);
    } else {
      checkAuthStatus().then(setAuthUser);
    }
    getCategories().then(setCategories).catch(console.error);
    if (initialIsAdmin) fetchAllAuthors().then(setAllAuthors).catch(console.error);
  }, []);

  useEffect(() => {
    if (editor && initialArticle?.content) {
      const result = convertLegacyContent(initialArticle.content);
      setParsedBlocks(result.blocks);
      setToc(result.toc);
    }
  }, [editor, initialArticle?.content]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  useEffect(() => {
    if (editor) {
      const handleUpdate = () => { if (!isSaving) setHasUnsavedChanges(true); };
      editor.on("update", handleUpdate);
      return () => { editor.off("update", handleUpdate); };
    }
  }, [editor, isSaving]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const handleEditorImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadingEditorImage(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          try {
            const response = await fetch("/api/inline-upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ file: reader.result, fileName: file.name, articleId, userId: authUser?.user?.id }),
            });
            const data = await response.json();
            setUploadingEditorImage(false);
            if (data.url) {
              editor?.chain().focus().insertContent(`<img src="${data.url}" data-asset-id="${data.assetId}" />`).run();
            }
          } catch {
            setUploadingEditorImage(false);
          }
        };
      }
    };
    input.click();
  }, [editor, articleId, authUser]);

  const handleEditorVideoUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadingEditorImage(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          (async () => {
            try {
              const response = await fetch("/api/inline-video-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: reader.result, fileName: file.name, articleId, userId: authUser?.user?.id }),
              });
              const data = await response.json();
              setUploadingEditorImage(false);
              if (data.url) {
                editor?.chain().focus().insertContent(`<video src="${data.url}" controls data-asset-id="${data.assetId}"></video>`).run();
              }
            } catch {
              setUploadingEditorImage(false);
            }
          })();
        };
      }
    };
    input.click();
  }, [editor, articleId, authUser]);

  const handleInlineImageSelect = useCallback(() => { setInlineAssetType("image"); setShowInlineAssetModal(true); }, []);
  const handleInlineVideoSelect = useCallback(() => { setInlineAssetType("video"); setShowInlineAssetModal(true); }, []);

  const handleExistingAssetSelect = useCallback(async (assetId: string, assetUrl: string) => {
    setShowInlineAssetModal(false);
    if (inlineAssetType === "image") {
      editor?.chain().focus().insertContent(`<img src="${assetUrl}" alt="" data-asset-id="${assetId}" />`).run();
    } else {
      editor?.chain().focus().insertContent(`<video src="${assetUrl}" controls data-asset-id="${assetId}"></video>`).run();
    }
  }, [editor, inlineAssetType]);

  const handleAssetClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target.closest("img") as HTMLImageElement;
    const video = target.closest("video") as HTMLVideoElement;
    if (img) {
      setEditingAsset({ type: "image", element: img });
      setAssetAltText(img.getAttribute("alt") || "");
      setAssetCaption("");
      setShowAssetEditModal(true);
    } else if (video) {
      setEditingAsset({ type: "video", element: video });
      setAssetAltText("");
      setAssetCaption("");
      setShowAssetEditModal(true);
    }
  }, []);

  const updateAssetAltText = useCallback(() => {
    if (!editingAsset) return;
    if (editingAsset.type === "image") {
      editingAsset.element.setAttribute("alt", assetAltText);
      const html = editor?.getHTML() || "";
      const result = convertLegacyContent(html);
      setParsedBlocks(result.blocks);
      setToc(result.toc);
    }
    setShowAssetEditModal(false);
    setEditingAsset(null);
  }, [editingAsset, assetAltText, editor]);

  const handleSwapAsset = useCallback(() => {
    setShowAssetEditModal(false);
    if (editingAsset?.type === "image") handleInlineImageSelect();
    else if (editingAsset?.type === "video") handleInlineVideoSelect();
  }, [editingAsset]);

  const handleRemoveAsset = useCallback(() => {
    if (!editingAsset) return;
    editingAsset.element.remove();
    setShowAssetEditModal(false);
    setEditingAsset(null);
  }, [editingAsset]);

  const removeThumbnail = () => setMetadata((prev) => ({ ...prev, image: null }));

  const handleSaveDraft = async () => {
    if (!metadata.title.trim()) return;
    if (!authUser?.authenticated || !authUser.user) return;
    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";
    const authorId = isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;
    try {
      if (articleId) {
        const result = await updateArticle(articleId, {
          title: metadata.title, content: htmlContent, blocks: articleFormat === "blocks" ? parsedBlocks : null,
          image: metadata.image, category_id: metadata.category_id || null, tags: metadata.tags,
          summary: metadata.seoDescription, read_time: `${metadata.readTime} min`, status: "draft",
          author_id: authorId, author_name: authUser.user.user_metadata.full_name || null, thumbnail_id: metadata.thumbnail_id || null,
        });
        if (result) setHasUnsavedChanges(false);
      } else {
        const result = await createArticle({
          title: metadata.title, content: htmlContent, blocks: parsedBlocks,
          image: metadata.image, category_id: metadata.category_id || null, tags: metadata.tags,
          summary: metadata.seoDescription, read_time: `${metadata.readTime}`, status: "draft",
          author_id: authorId, author_name: authUser.user.user_metadata.full_name || null, thumbnail_id: metadata.thumbnail_id || null,
        });
        if (result) { setArticleId(result.id); setHasUnsavedChanges(false); }
      }
    } finally { setIsSaving(false); }
  };

  const handlePublish = async () => {
    if (!authUser?.authenticated || !authUser.user) { setShowPublishModal(false); return; }
    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";
    try {
      const authorId = isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;
      const blocksToSave = articleFormat === "blocks" ? parsedBlocks : null;
      let result;
      if (articleId) {
        result = await updateArticle(articleId, {
          title: metadata.title, content: htmlContent, blocks: blocksToSave,
          image: metadata.image, category_id: metadata.category_id || null, tags: metadata.tags,
          summary: metadata.seoDescription, read_time: `${metadata.readTime} min`, status: "published",
          author_id: authorId, author_name: authUser.user.user_metadata.full_name || null, thumbnail_id: metadata.thumbnail_id || null,
        }, authUser.user.id);
      } else {
        result = await createArticle({
          title: metadata.title, content: htmlContent, blocks: blocksToSave,
          image: metadata.image, category_id: metadata.category_id || null, tags: metadata.tags,
          summary: metadata.seoDescription, read_time: `${metadata.readTime} min`, status: "published",
          author_id: isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id,
          author_name: authUser.user.user_metadata.full_name || null,
        });
      }
      if (result) {
        setArticleId(result.id);
        setIsPublished(true);
        fetch(`${process.env.NEXT_PUBLIC_BASE_MAIN_APP || "https://techinika.com"}/api/push/send`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Article Published!", message: metadata.title, url: `${process.env.NEXT_PUBLIC_BASE_MAIN_APP || "https://techinika.com"}/${result.slug || result.id}`, articleId: result.id }),
        }).catch(() => {});
      }
    } finally { setIsSaving(false); setShowPublishModal(false); }
  };

  const handleUpdate = async () => {
    if (!authUser?.authenticated || !authUser.user) { setShowUpdateModal(false); return; }
    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";
    try {
      const authorId = isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;
      const blocksToSave = articleFormat === "blocks" ? parsedBlocks : null;
      const result = await updateArticle(articleId!, {
        title: metadata.title, content: htmlContent, blocks: blocksToSave,
        image: metadata.image, category_id: metadata.category_id || null, tags: metadata.tags,
        summary: metadata.seoDescription, read_time: `${metadata.readTime} min`,
        status: isPublished ? "published" : "draft",
        author_id: authorId, author_name: authUser.user.user_metadata.full_name || null, thumbnail_id: metadata.thumbnail_id || null,
      }, authUser.user.id);
    } finally { setIsSaving(false); setShowUpdateModal(false); }
  };

  const handlePublishCheck = () => {
    if (!metadata.title.trim()) { showToast("warning", "Please add a title"); return; }
    if (!editor?.getText().trim()) { showToast("warning", "Please add some content"); return; }
    if (isNewArticle && !isAdmin && unresolvedCount === 0) { showToast("warning", "Please add at least one feedback comment before publishing."); return; }
    if (isOwner && !isAdmin && unresolvedCount > 0) { showToast("warning", `Please resolve all ${unresolvedCount} feedback item(s) before publishing.`); return; }
    setShowPublishModal(true);
  };

  const handleUpdateCheck = () => {
    if (!metadata.title.trim()) { showToast("warning", "Please add a title"); return; }
    if (!editor?.getText().trim()) { showToast("warning", "Please add some content"); return; }
    setShowUpdateModal(true);
  };

  const handleGenerateAIFeedback = async () => {
    if (!articleId) { showToast("warning", "Please save the article first"); return; }
    if (!authUser?.authenticated || !authUser.user) { showToast("warning", "Please log in to generate feedback"); return; }
    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, authorId: authUser.user.id }),
      });
      if (response.ok) {
        const newFeedbacks = await response.json();
        if (newFeedbacks && newFeedbacks.length > 0) {
          setFeedback((prev) => [...newFeedbacks, ...prev]);
          setUnresolvedCount((prev) => prev + newFeedbacks.length);
          showToast("success", `Generated ${newFeedbacks.length} AI feedback(s)!`);
        } else { showToast("info", "No feedback generated"); }
      } else { showToast("error", "Failed to generate feedback"); }
    } catch { showToast("error", "Failed to generate feedback"); }
    finally { setIsGeneratingAI(false); }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !authUser?.authenticated || !authUser.user || !articleId) return;
    setIsSubmittingComment(true);
    try {
      const result = await addFeedback(articleId, authUser.user.id, newComment.trim());
      if (result) { setFeedback((prev) => [result, ...prev]); setUnresolvedCount((prev) => prev + 1); setNewComment(""); }
    } finally { setIsSubmittingComment(false); }
  };

  const handleResolveFeedback = async (feedbackId: string) => {
    if (!articleId) return;
    const success = await markFeedbackResolved(feedbackId, articleId);
    if (success) {
      setFeedback((prev) => prev.map((f) => f.id === feedbackId ? { ...f, resolved: true, resolved_at: new Date().toISOString() } : f));
      setUnresolvedCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleChangeOwner = async () => {
    if (!selectedOwnerId || !articleId) return;
    setIsUpdatingOwner(true);
    try {
      const success = await changeArticleOwner(articleId, selectedOwnerId);
      if (success) window.location.reload();
    } finally { setIsUpdatingOwner(false); }
  };

  const handleAddContributor = async (authorId: string) => {
    if (!articleId) return;
    setIsAddingContributor(true);
    try {
      const result = await addArticleContributor(articleId, authorId);
      if (result) setContributors((prev) => [...prev, result]);
    } finally { setIsAddingContributor(false); }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    if (!articleId) return;
    const success = await removeArticleContributor(contributorId, articleId);
    if (success) setContributors((prev) => prev.filter((c) => c.id !== contributorId));
  };

  return {
    metadata, setMetadata, isSaving, setIsSaving, showPreview, setShowPreview,
    linkUrl, setLinkUrl, showLinkInput, setShowLinkInput,
    isPublished, setIsPublished, articleId, setArticleId, categories,
    uploadingImage, setUploadingImage, uploadingEditorImage, setUploadingEditorImage,
    showAssetModal, setShowAssetModal, showInlineAssetModal, setShowInlineAssetModal,
    inlineAssetType, setInlineAssetType, showImageOptions, setShowImageOptions,
    showVideoOptions, setShowVideoOptions, editingAsset, setEditingAsset,
    assetAltText, setAssetAltText, assetCaption, setAssetCaption, showAssetEditModal, setShowAssetEditModal,
    authUser, setAuthUser, isOwner, setIsOwner, feedback, setFeedback,
    unresolvedCount, setUnresolvedCount, newComment, setNewComment,
    isSubmittingComment, showFeedbackPanel, setShowFeedbackPanel, isAdmin,
    isNewArticle, contributors, setContributors, allAuthors, setAllAuthors,
    showTeamPanel, setShowTeamPanel, selectedOwnerId, setSelectedOwnerId,
    isUpdatingOwner, isAddingContributor, isGeneratingAI, setIsGeneratingAI,
    hasUnsavedChanges, setHasUnsavedChanges, showPublishModal, setShowPublishModal,
    showUpdateModal, setShowUpdateModal, parsedBlocks, toc, articleFormat, setArticleFormat,
    editor, wordCount,
    setLink, handleEditorImageUpload, handleEditorVideoUpload,
    handleInlineImageSelect, handleInlineVideoSelect, handleExistingAssetSelect,
    handleAssetClick, updateAssetAltText, handleSwapAsset, handleRemoveAsset,
    removeThumbnail, handleSaveDraft, handlePublish, handleUpdate,
    handlePublishCheck, handleUpdateCheck, handleGenerateAIFeedback,
    handleSubmitComment, handleResolveFeedback, handleChangeOwner,
    handleAddContributor, handleRemoveContributor,
  };
}
