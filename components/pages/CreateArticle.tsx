"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Save,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  Loader2,
  Video,
  ImagePlus,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  Crown,
  User,
  Edit2,
  Sparkles,
  FileText,
} from "lucide-react";
import NextLink from "next/link";
import {
  createArticle,
  updateArticle,
  getCategories,
} from "@/supabase/CRUD/querries";
import {
  uploadThumbnailToCloudinary,
  uploadArticleImageToCloudinary,
  uploadArticleVideoToCloudinary,
} from "@/lib/cloudinary";
import { checkAuthStatus, AuthResult } from "@/lib/auth";
import { Category } from "@/types/category";
import { JoinedArticle } from "@/types/article";
import { ArticleFeedback } from "@/types/article";
import { ArticleContributor } from "@/types/article";
import {
  addFeedback,
  markFeedbackResolved,
  addAIFeedback,
} from "@/app/actions/feedback";
import {
  addArticleContributor,
  removeArticleContributor,
  changeArticleOwner,
  fetchAllAuthors,
} from "@/app/actions/contributors";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

import UserNav from "@/components/UserNav";

import AssetSelectionModal from "@/components/AssetSelectionModal";
import { Block, TOCEntry, isLegacyContent, convertLegacyContent, blocksToHtml } from "@/lib/content-parser";

// Helper to build asset URL map from blocks (for preview)
const buildAssetUrlMapFromBlocks = (blocks: Block[]): Record<string, string> => {
  const map: Record<string, string> = {};
  // This is a client-side helper - in preview mode we use the URLs already in the editor
  // For now, we'll rely on the server-side assetUrlMap
  return map;
};

interface Metadata {
  title: string;
  slug: string;
  seoDescription: string;
  tags: string;
  readTime: number;
  category_id: string;
  image: string | null;
  thumbnail_id: string | null;
}

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

const ArticleEditor = ({
  authUser: initialAuthUser,
  article: initialArticle,
  isOwner: initialIsOwner = true,
  isAdmin: initialIsAdmin = false,
  feedback: initialFeedback = [],
  unresolvedCount: initialUnresolvedCount = 0,
  contributors: initialContributors = [],
  allAuthors: initialAllAuthors = [],
  isNewArticle: initialIsNewArticle = false,
}: ArticleEditorProps) => {
  const { showToast } = useToast();
  const [metadata, setMetadata] = useState<Metadata>({
    title: initialArticle?.title || "",
    slug: initialArticle?.slug || "",
    seoDescription: initialArticle?.summary || "",
    tags: initialArticle?.tags || "",
    readTime: parseInt(initialArticle?.read_time || "5") || 5,
    category_id: initialArticle?.category?.id || "",
    image: initialArticle?.image || null,
    thumbnail_id: (initialArticle as any)?.thumbnail_id || null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isPublished, setIsPublished] = useState(
    initialArticle?.status === "published",
  );
  const [articleId, setArticleId] = useState<string | null>(
    initialArticle?.id || null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showInlineAssetModal, setShowInlineAssetModal] = useState(false);
  const [inlineAssetType, setInlineAssetType] = useState<"image" | "video">("image");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowImageOptions(false);
        setShowVideoOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [authUser, setAuthUser] = useState<AuthResult | null>(
    initialAuthUser || null,
  );
  const [isOwner, setIsOwner] = useState(initialIsOwner);
  const [feedback, setFeedback] = useState<ArticleFeedback[]>(initialFeedback);
  const [unresolvedCount, setUnresolvedCount] = useState(
    initialUnresolvedCount,
  );
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(true);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [isNewArticle, setIsNewArticle] = useState(initialIsNewArticle);
  const [contributors, setContributors] =
    useState<ArticleContributor[]>(initialContributors);
  const [allAuthors, setAllAuthors] =
    useState<{ id: string; name: string; image_url: string | null }[]>(
      initialAllAuthors,
    );
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(
    initialArticle?.author?.id ||
      (initialAllAuthors.length > 0 ? initialAllAuthors[0].id : null),
  );
  const [isUpdatingOwner, setIsUpdatingOwner] = useState(false);
  const [isAddingContributor, setIsAddingContributor] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showFeedbackWarning, setShowFeedbackWarning] = useState(false);

    const [parsedBlocks, setParsedBlocks] = useState<Block[]>([]);
  const [toc, setToc] = useState<TOCEntry[]>([]);
  const [articleFormat, setArticleFormat] = useState<"html" | "blocks">(
    initialArticle?.blocks && initialArticle.blocks.length > 0 ? "blocks" : "html"
  );

    const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your amazing story...",
      }),
      Underline,
      Strike,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#3182ce] underline hover:text-[#2c5282] cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto",
        },
      }),
    ],
    content: initialArticle?.content || "",
    immediatelyRender: false,
    editable: initialIsOwner,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[500px] leading-relaxed text-gray-700",
      },
    },
    onUpdate: ({ editor }) => {
      if (editor) {
        const html = editor.getHTML();
        const result = convertLegacyContent(html);
        setParsedBlocks(result.blocks);
        setToc(result.toc);
      }
    },
  });

  // Handle block parsing based on format
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
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  useEffect(() => {
    if (initialAuthUser) {
      setAuthUser(initialAuthUser);
    } else {
      const checkAuth = async () => {
        const authResult = await checkAuthStatus();
        setAuthUser(authResult);
      };
      checkAuth();
    }
    getCategories().then(setCategories).catch(console.error);
    if (initialIsAdmin) {
      fetchAllAuthors().then(setAllAuthors).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (editor && initialArticle?.content) {
      const result = convertLegacyContent(initialArticle.content);
      setParsedBlocks(result.blocks);
      setToc(result.toc);
    }
  }, [editor, initialArticle?.content]);

  // Handle browser beforeunload for unsaved changes
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

  // Set hasUnsavedChanges when editor content changes
  useEffect(() => {
    if (editor) {
      const handleUpdate = () => {
        if (!isSaving) {
          setHasUnsavedChanges(true);
        }
      };
      editor.on("update", handleUpdate);
      return () => {
        editor.off("update", handleUpdate);
      };
    }
  }, [editor, isSaving]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
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
        
        // Read file as base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          try {
            // Upload through API that creates asset and tracks article_assets
            const response = await fetch("/api/inline-upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: reader.result,
                fileName: file.name,
                articleId: articleId,
                userId: authUser?.user?.id,
              }),
            });
            
            const data = await response.json();
            setUploadingEditorImage(false);
            
            if (data.url) {
              // Insert image with reference to asset ID
              const assetId = data.assetId;
              editor?.chain().focus().insertContent(
                `<img src="${data.url}" data-asset-id="${assetId}" />`
              ).run();
              showToast("success", "Image uploaded!");
            } else {
              showToast("error", data.error || "Failed to upload image");
            }
          } catch (error) {
            setUploadingEditorImage(false);
            showToast("error", "Failed to upload image");
          }
        };
      }
    };
    input.click();
  }, [editor, articleId, authUser]);

  const handleInlineImageSelect = useCallback(() => {
    setInlineAssetType("image");
    setShowInlineAssetModal(true);
  }, []);

  const handleInlineVideoSelect = useCallback(() => {
    setInlineAssetType("video");
    setShowInlineAssetModal(true);
  }, []);

  const handleExistingAssetSelect = useCallback(async (assetId: string, assetUrl: string) => {
    setShowInlineAssetModal(false);
    if (inlineAssetType === "image") {
      editor?.chain().focus().insertContent(
        `<img src="${assetUrl}" alt="" data-asset-id="${assetId}" />`
      ).run();
      showToast("success", "Image inserted!");
    } else {
      editor?.chain().focus().insertContent(
        `<video src="${assetUrl}" controls data-asset-id="${assetId}"></video>`
      ).run();
      showToast("success", "Video inserted!");
    }
  }, [editor, inlineAssetType]);

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
                body: JSON.stringify({
                  file: reader.result,
                  fileName: file.name,
                  articleId: articleId,
                  userId: authUser?.user?.id,
                }),
              });

              const data = await response.json();
              setUploadingEditorImage(false);

              if (data.url) {
                const assetId = data.assetId;
                editor?.chain().focus().insertContent(
                  `<video src="${data.url}" controls data-asset-id="${assetId}"></video>`
                ).run();
                showToast("success", "Video uploaded!");
              } else {
                showToast("error", data.error || "Failed to upload video");
              }
            } catch (error) {
              setUploadingEditorImage(false);
              showToast("error", "Failed to upload video");
            }
          })();
        };
      }
    };
    input.click();
  }, [editor, articleId, authUser]);

  const removeThumbnail = () => {
    setMetadata((prev) => ({ ...prev, image: null }));
  };

  const handleSaveDraft = async () => {
    if (!metadata.title.trim()) {
      showToast("warning", "Please add a title");
      return;
    }

    if (!authUser?.authenticated || !authUser.user) {
      showToast("warning", "Please log in to save drafts");
      return;
    }

    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";
    const authorId =
      isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;

    try {
      if (articleId) {
        const result = await updateArticle(articleId, {
          title: metadata.title,
          content: htmlContent,
          blocks: articleFormat === "blocks" ? parsedBlocks : null,
          image: metadata.image,
          category_id: metadata.category_id || null,
          tags: metadata.tags,
          summary: metadata.seoDescription,
          read_time: `${metadata.readTime} min`,
          status: "draft",
          author_id: authorId,
          author_name: authUser.user.user_metadata.full_name || null,
          thumbnail_id: metadata.thumbnail_id || null,
        });
        if (result) {
          showToast("success", "Draft saved!");
          setHasUnsavedChanges(false);
        }
      } else {
        const result = await createArticle({
          title: metadata.title,
          content: htmlContent,
          blocks: parsedBlocks,
          image: metadata.image,
          category_id: metadata.category_id || null,
          tags: metadata.tags,
          summary: metadata.seoDescription,
          read_time: `${metadata.readTime}`,
          status: "draft",
          author_id: authorId,
          author_name: authUser.user.user_metadata.full_name || null,
          thumbnail_id: metadata.thumbnail_id || null,
        });
        if (result) {
          setArticleId(result.id);
          showToast("success", "Draft saved!");
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("error", "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishCheck = () => {
    if (!metadata.title.trim()) {
      showToast("warning", "Please add a title");
      return;
    }
    if (!editor?.getText().trim()) {
      showToast("warning", "Please add some content");
      return;
    }

    if (isNewArticle && !isAdmin && unresolvedCount === 0) {
      showToast(
        "warning",
        "Please add at least one feedback comment before publishing.",
      );
      return;
    }

    if (isOwner && !isAdmin && unresolvedCount > 0) {
      showToast(
        "warning",
        `Please resolve all ${unresolvedCount} feedback item(s) before publishing.`,
      );
      return;
    }

    setShowPublishModal(true);
  };

  const handlePublish = async () => {
    if (!authUser?.authenticated || !authUser.user) {
      showToast("warning", "Please log in to publish articles");
      setShowPublishModal(false);
      return;
    }

    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";

    try {
      let result;
      const authorId =
        isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;
      const blocksToSave = articleFormat === "blocks" ? parsedBlocks : null;
      if (articleId) {
        result = await updateArticle(
          articleId,
          {
            title: metadata.title,
            content: htmlContent,
            blocks: blocksToSave,
            image: metadata.image,
            category_id: metadata.category_id || null,
            tags: metadata.tags,
            summary: metadata.seoDescription,
            read_time: `${metadata.readTime} min`,
            status: "published",
            author_id: authorId,
            author_name: authUser.user.user_metadata.full_name || null,
            thumbnail_id: metadata.thumbnail_id || null,
          },
          authUser.user.id,
        );
      } else {
        result = await createArticle({
          title: metadata.title,
          content: htmlContent,
          blocks: blocksToSave,
          image: metadata.image,
          category_id: metadata.category_id || null,
          tags: metadata.tags,
          summary: metadata.seoDescription,
          read_time: `${metadata.readTime} min`,
          status: "published",
          author_id:
            isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id,
          author_name: authUser.user.user_metadata.full_name || null,
        });
      }

      if (result) {
        setArticleId(result.id);
        setIsPublished(true);
        showToast("success", "Article published successfully!");

        fetch(
          `${process.env.NEXT_PUBLIC_BASE_MAIN_APP || "https://techinika.com"}/api/push/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "New Article Published!",
              message: metadata.title,
              url: `${process.env.NEXT_PUBLIC_BASE_MAIN_APP || "https://techinika.com"}/${result.slug || result.id}`,
              articleId: result.id,
            }),
          },
        ).catch((err) => console.error("Push notification error:", err));
      }
    } catch (error) {
      console.error("Error publishing:", error);
      showToast("error", "Failed to publish article");
    } finally {
      setIsSaving(false);
      setShowPublishModal(false);
    }
  };

  const handleUpdateCheck = () => {
    if (!metadata.title.trim()) {
      showToast("warning", "Please add a title");
      return;
    }
    if (!editor?.getText().trim()) {
      showToast("warning", "Please add some content");
      return;
    }

    setShowUpdateModal(true);
  };

  const handleUpdate = async () => {
    if (!authUser?.authenticated || !authUser.user) {
      showToast("warning", "Please log in to update articles");
      setShowUpdateModal(false);
      return;
    }

    setIsSaving(true);
    const htmlContent = editor?.getHTML() || "";

    try {
      const authorId =
        isAdmin && selectedOwnerId ? selectedOwnerId : authUser.user.id;
      const result = await updateArticle(
        articleId!,
        {
          title: metadata.title,
          content: htmlContent,
          image: metadata.image,
          category_id: metadata.category_id || null,
          tags: metadata.tags,
          summary: metadata.seoDescription,
          read_time: `${metadata.readTime} min`,
          status: isPublished ? "published" : "draft",
          author_id: authorId,
          author_name: authUser.user.user_metadata.full_name || null,
        },
        authUser.user.id,
      );

      if (result) {
        showToast("success", "Article updated successfully!");
      }
    } catch (error) {
      console.error("Error updating:", error);
      showToast("error", "Failed to update article");
    } finally {
      setIsSaving(false);
      setShowUpdateModal(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!authUser?.authenticated || !authUser.user) {
      showToast("warning", "Please log in to add feedback");
      return;
    }
    if (!articleId) {
      showToast("warning", "Please save the article first");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const result = await addFeedback(
        articleId,
        authUser.user.id,
        newComment.trim(),
      );
      if (result) {
        setFeedback((prev) => [result, ...prev]);
        setUnresolvedCount((prev) => prev + 1);
        setNewComment("");
        showToast("success", "Feedback submitted!");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast("error", "Failed to submit feedback");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveFeedback = async (feedbackId: string) => {
    if (!articleId) return;
    try {
      const success = await markFeedbackResolved(feedbackId, articleId);
      if (success) {
        setFeedback((prev) =>
          prev.map((f) =>
            f.id === feedbackId
              ? { ...f, resolved: true, resolved_at: new Date().toISOString() }
              : f,
          ),
        );
        setUnresolvedCount((prev) => Math.max(0, prev - 1));
        showToast("success", "Feedback resolved!");
      }
    } catch (error) {
      console.error("Error resolving feedback:", error);
      showToast("error", "Failed to resolve feedback");
    }
  };

  const handleGenerateAIFeedback = async () => {
    if (!articleId) {
      showToast("warning", "Please save the article first");
      return;
    }
    if (!authUser?.authenticated || !authUser.user) {
      showToast("warning", "Please log in to generate feedback");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, authorId: authUser.user.id }),
      });

      if (response.ok) {
        const newFeedbacks = await response.json();
        if (newFeedbacks && newFeedbacks.length > 0) {
          setFeedback((prev) => [...newFeedbacks, ...prev]);
          setUnresolvedCount((prev) => prev + newFeedbacks.length);
          showToast(
            "success",
            `Generated ${newFeedbacks.length} AI feedback(s)!`,
          );
        } else {
          showToast("info", "No feedback generated");
        }
      } else {
        showToast("error", "Failed to generate feedback");
      }
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      showToast("error", "Failed to generate feedback");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleChangeOwner = async () => {
    if (!selectedOwnerId || !articleId) return;
    setIsUpdatingOwner(true);
    try {
      const success = await changeArticleOwner(articleId, selectedOwnerId);
      if (success) {
        showToast("success", "Owner updated successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating owner:", error);
      showToast("error", "Failed to update owner");
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  const handleAddContributor = async (authorId: string) => {
    if (!articleId) return;
    setIsAddingContributor(true);
    try {
      const result = await addArticleContributor(articleId, authorId);
      if (result) {
        setContributors((prev) => [...prev, result]);
        showToast("success", "Contributor added!");
      }
    } catch (error) {
      console.error("Error adding contributor:", error);
      showToast("error", "Failed to add contributor");
    } finally {
      setIsAddingContributor(false);
    }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    if (!articleId) return;
    try {
      const success = await removeArticleContributor(contributorId, articleId);
      if (success) {
        setContributors((prev) => prev.filter((c) => c.id !== contributorId));
        showToast("success", "Contributor removed!");
      }
    } catch (error) {
      console.error("Error removing contributor:", error);
      showToast("error", "Failed to remove contributor");
    }
  };

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
    disabled,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-all duration-200 ${
        isActive
          ? `bg-[${PRIMARY_COLOR}]/10 text-[${PRIMARY_COLOR}]`
          : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={
        isActive
          ? { backgroundColor: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR }
          : undefined
      }
    >
      {children}
    </button>
  );

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    multiline = false,
    required = false,
  }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    multiline?: boolean;
    required?: boolean;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all duration-200 resize-none"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all duration-200"
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <NextLink
            href="/"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </NextLink>
          <div className="flex flex-col">
            {isOwner ? (
              <input
                type="text"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Article Title"
                className="text-xl font-bold text-gray-900 bg-transparent focus:outline-none placeholder-gray-300 w-96"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 w-96 truncate">
                {metadata.title || "Untitled Article"}
              </h1>
            )}
            <span className="text-xs text-gray-400">
              {wordCount} words • {metadata.readTime} min read
              {initialArticle?.author && (
                <span className="ml-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {initialArticle.author.name}
                </span>
              )}
              {!isOwner && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Review Mode
                </span>
              )}
              {isPublished && (
                <span className="ml-2 text-green-600 font-medium">
                  • Published
                </span>
              )}
              {isOwner && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="text-xs text-gray-500">Format:</span>
                  <button
                    onClick={() => setArticleFormat("html")}
                    className={`px-2 py-0.5 text-xs rounded ${
                      articleFormat === "html"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setArticleFormat("blocks")}
                    className={`px-2 py-0.5 text-xs rounded ${
                      articleFormat === "blocks"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Blocks
                  </button>
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOwner && unresolvedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">
                {unresolvedCount} unresolved feedback
              </span>
            </div>
          )}

          {(isOwner || isAdmin) && (
            <button
              onClick={() => setShowTeamPanel(!showTeamPanel)}
              className={`p-2 rounded-md transition-colors ${showTeamPanel ? "bg-[#3182ce]/10 text-[#3182ce]" : "text-gray-600 hover:bg-gray-100"}`}
              title="Team"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
            className={`p-2 rounded-md transition-colors ${showFeedbackPanel ? "bg-[#3182ce]/10 text-[#3182ce]" : "text-gray-600 hover:bg-gray-100"}`}
            title="Feedback"
          >
            <MessageSquare className="w-4 h-4" />
            {feedback.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {feedback.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={showPreview ? "Edit Mode" : "Preview"}
          >
            {showPreview ? (
              <Edit2 className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {isOwner && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Save Draft"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={isPublished ? handleUpdateCheck : handlePublishCheck}
                disabled={isSaving}
                className={`p-2 rounded-md transition-all duration-200 ${
                  isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : `bg-[${PRIMARY_COLOR}] hover:bg-[#2c5282] text-white`
                } disabled:opacity-70`}
                title={isPublished ? "Update" : "Publish"}
                style={isPublished ? {} : { backgroundColor: PRIMARY_COLOR }}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPublished ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
            </>
          )}

          <UserNav user={authUser || undefined} />
        </div>
       </header>



       {/* TOOLBAR - Only show for owner */}
      {isOwner && (
        <div className="flex items-center justify-center py-2 bg-white border-b border-gray-200/60">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50/80 rounded-md border border-gray-200/50">
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              isActive={editor?.isActive("underline")}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              isActive={editor?.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor?.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor?.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor?.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive("blockquote")}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              isActive={editor?.isActive("codeBlock")}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <div className="relative">
              <ToolbarButton
                onClick={() => setShowLinkInput(!showLinkInput)}
                isActive={editor?.isActive("link")}
                title="Link"
              >
                {editor?.isActive("link") ? (
                  <Unlink className="w-4 h-4" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
              </ToolbarButton>
              {showLinkInput && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 p-3 z-50 min-w-[280px]">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                      onKeyDown={(e) => e.key === "Enter" && setLink()}
                    />
                    <button
                      onClick={setLink}
                      className="p-2 text-white rounded-md hover:opacity-90"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                  {editor?.isActive("link") && (
                    <button
                      onClick={() => editor.chain().focus().unsetLink().run()}
                      className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" /> Remove link
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <ToolbarButton
                onClick={() => setShowImageOptions(!showImageOptions)}
                title="Add Image"
                disabled={uploadingEditorImage}
              >
                {uploadingEditorImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
              </ToolbarButton>
              {showImageOptions && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]">
                  <button
                    onClick={() => {
                      setShowImageOptions(false);
                      handleEditorImageUpload();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Upload New Image
                  </button>
                  <button
                    onClick={() => {
                      setShowImageOptions(false);
                      handleInlineImageSelect();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Choose Existing
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <ToolbarButton
                onClick={() => setShowVideoOptions(!showVideoOptions)}
                title="Add Video"
                disabled={uploadingEditorImage}
              >
                {uploadingEditorImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </ToolbarButton>
              {showVideoOptions && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]">
                  <button
                    onClick={() => {
                      setShowVideoOptions(false);
                      handleEditorVideoUpload();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Upload New Video
                  </button>
                  <button
                    onClick={() => {
                      setShowVideoOptions(false);
                      handleInlineVideoSelect();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Choose Existing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: METADATA */}
        <aside className="w-80 shadow bg-white/50 backdrop-blur-sm p-6 overflow-y-auto space-y-6">
          {isOwner ? (
            <div className="space-y-6">
              {/* Thumbnail */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Featured Image
                </label>
                <div className="relative w-full h-36 bg-gradient-to-br from-gray-100 to-gray-50 rounded-md border-2 border-dashed border-gray-200 group overflow-hidden">
                  {metadata.image ? (
                    <>
                      <img
                        src={metadata.image || ""}
                        className="w-full h-full object-cover"
                        alt="Thumbnail"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          onClick={() => setShowAssetModal(true)}
                          className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md cursor-pointer hover:bg-gray-100"
                        >
                          Change
                        </button>
                        <button
                          onClick={removeThumbnail}
                          className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAssetModal(true)}
                      className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-300 mb-2" />
                          <span className="text-gray-400 text-sm font-medium">
                            Add Image
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={metadata.category_id}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      category_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Time */}
              <InputField
                label="Read Time"
                value={metadata.readTime}
                onChange={(value) =>
                  setMetadata((prev) => ({
                    ...prev,
                    readTime: parseInt(value) || 5,
                  }))
                }
                type="number"
                placeholder="Minutes"
              />

              {/* Tags */}
              <InputField
                label="Tags"
                value={metadata.tags}
                onChange={(value: string) =>
                  setMetadata((prev) => ({ ...prev, tags: value }))
                }
                placeholder="React, Next.js, TypeScript"
              />

              {/* SEO Description */}
              <InputField
                label="SEO Description"
                value={metadata.seoDescription}
                onChange={(value: string) =>
                  setMetadata((prev) => ({ ...prev, seoDescription: value }))
                }
                placeholder="Meta description for search engines..."
                multiline
              />

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-700">
                    Keep your SEO description under 160 characters for best
                    results.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {metadata.seoDescription.length}/160 characters
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Admin: Writer selector for new articles */}
              {isAdmin && allAuthors.length > 0 && !initialArticle && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Writer
                  </label>
                  <select
                    value={selectedOwnerId || ""}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] transition-all"
                  >
                    {allAuthors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Non-admin: Show current writer */}
              {!isAdmin && !initialArticle && authUser?.user && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Writer
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {authUser.profilePicture ? (
                      <img
                        src={authUser.profilePicture}
                        alt={authUser.user.user_metadata.full_name || "User"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                        {(
                          authUser.user.user_metadata.full_name ||
                          authUser.user.email ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {authUser.user.user_metadata.full_name ||
                        authUser.user.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* EDITOR AREA */}
        <main
          className={`flex-1 overflow-y-auto p-8 pb-32 ${showFeedbackPanel && !isOwner ? "pr-80" : ""}`}
        >
          <div className="max-w-3xl mx-auto">
            {showPreview ? (
              <div className="bg-white rounded-md shadow-sm border border-gray-200 p-12 min-h-[500px]">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                  {metadata.title || "Untitled Article"}
                </h1>
                {metadata.image && (
                  <img
                    src={metadata.image || ""}
                    className="w-full h-64 object-cover rounded-md mb-8"
                    alt="Thumbnail"
                  />
                )}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: articleFormat === "blocks" && parsedBlocks.length > 0
                      ? blocksToHtml(parsedBlocks, buildAssetUrlMapFromBlocks(parsedBlocks))
                      : editor?.getHTML() || ""
                  }}
                />
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-gray-200 rounded-md overflow-hidden">
                {/* THUMBNAIL UPLOADER (Compact) */}
                {metadata.image && (
                  <div className="relative w-full h-40 bg-gray-50 border-b border-gray-100">
                    <img
                      src={metadata.image || ""}
                      className="w-full h-full object-cover"
                      alt="Thumbnail"
                    />
                    <button
                      onClick={removeThumbnail}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* CONTENT AREA */}
                <div className="p-8 prose lg:prose-xl max-w-none">
                  <EditorContent editor={editor} />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* FEEDBACK SIDEBAR */}
        {showFeedbackPanel && (
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
                              {(item.author?.name || "U")
                                .charAt(0)
                                .toUpperCase()}
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
                                <CheckCircle className="w-3 h-3" /> Mark
                                Resolved
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
        )}

        {/* TEAM SIDEBAR - Only for owner/admin */}
        {showTeamPanel && (isOwner || isAdmin) && (
          <aside className="w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Management
              </h3>
            </div>

            {/* Writer Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">
                  Writer
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                {initialArticle?.author?.image_url ? (
                  <img
                    src={initialArticle.author.image_url}
                    alt={initialArticle.author.name || "Writer"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-sm">
                    {(initialArticle?.author?.name || "W")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {initialArticle?.author?.name || "Unknown"}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-3">
                  <select
                    value={selectedOwnerId || ""}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  >
                    <option value="">Change writer...</option>
                    {allAuthors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                  {selectedOwnerId &&
                    selectedOwnerId !== initialArticle?.author?.id && (
                      <button
                        onClick={handleChangeOwner}
                        disabled={isUpdatingOwner}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingOwner ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Crown className="w-4 h-4" />
                        )}
                        Change Writer
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* Contributors */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#3182ce]" />
                <span className="text-sm font-medium text-gray-700">
                  Contributors
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {contributors.length === 0 ? (
                  <p className="text-xs text-gray-500">No contributors yet</p>
                ) : (
                  contributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                    >
                      {contributor.author?.image_url ? (
                        <img
                          src={contributor.author.image_url}
                          alt={contributor.author.name || "Contributor"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">
                          {(contributor.author?.name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {contributor.author?.name || "Unknown"}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() =>
                            handleRemoveContributor(contributor.id)
                          }
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {isAdmin && (
                <div className="mt-3">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddContributor(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Add contributor...
                    </option>
                    {allAuthors
                      .filter(
                        (a) =>
                          a.id !== initialArticle?.author?.id &&
                          !contributors.some((c) => c.author_id === a.id),
                      )
                      .map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Read-only info for non-admin */}
            {!isAdmin && (
              <div className="p-4">
                <p className="text-xs text-gray-500">
                  Only admins can change the writer or manage contributors.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      <ConfirmModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublish}
        title="Publish Article"
        message={`Are you sure you want to publish "${metadata.title}"?`}
        confirmLabel="Publish"
        type="info"
        loading={isSaving}
      />

      <ConfirmModal
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="Update Article"
        message={`Are you sure you want to update "${metadata.title}"?`}
        confirmLabel="Update"
        type="info"
        loading={isSaving}
      />

      <AssetSelectionModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSelect={(asset, field) => {
          // Set the thumbnail image URL and store the asset ID
          setMetadata((prev) => ({
            ...prev,
            image: asset.url,
            thumbnail_id: asset.id
          }));
          setShowAssetModal(false);
        }}
        user={authUser || undefined}
      />

      <AssetSelectionModal
        isOpen={showInlineAssetModal}
        onClose={() => setShowInlineAssetModal(false)}
        onSelect={(asset) => handleExistingAssetSelect(asset.id, asset.url)}
        user={authUser || undefined}
        filterType={inlineAssetType}
      />
    </div>
  );
};

export default ArticleEditor;

