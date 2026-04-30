"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Trash2,
  Edit2,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Link2,
  Image,
  BarChart3,
  Globe,
  RefreshCw,
} from "lucide-react";
import {
  useEditor,
  EditorContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  getQuickBytes,
  createQuickByte,
  updateQuickByte,
  deleteQuickByte,
} from "@/supabase/CRUD/queries";
import { QuickByte, QuickByteFormData } from "@/types/quickByte";
import { AuthResult, checkAuthStatus } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { supabaseAdminClient } from "@/supabase/supabase";

interface BytesPageProps {
  user?: AuthResult;
}

export default function BytesPage({ user: initialUser }: BytesPageProps) {
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthResult | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bytes, setBytes] = useState<QuickByte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingByte, setEditingByte] = useState<QuickByte | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingByte, setDeletingByte] = useState<QuickByte | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<QuickByteFormData>({
    title: "",
    content: "",
    link: "",
    summary: "",
    status: "draft",
    lang: "en",
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your quick byte content...",
      }),
      Underline,
      Strike,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#3182ce] underline hover:text-[#2c5282] cursor-pointer",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto",
        },
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-gray-700",
      },
    },
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const auth = await checkAuthStatus();
      setUser(auth);
      if (auth.isAdmin) {
        loadBytes();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadBytes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuickBytes();
      setBytes(data);
    } catch (err) {
      console.error("Error loading quick bytes:", err);
      setError("Failed to load quick bytes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user?.isAdmin) return;

    const channel = supabaseAdminClient
      .channel('quick_bytes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_bytes' },
        (payload) => {
          console.log('Realtime update:', payload);
          loadBytes();
        }
      )
      .subscribe();

    return () => {
      supabaseAdminClient.removeChannel(channel);
    };
  }, [user?.isAdmin]);

  const filteredBytes = bytes.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(query) ||
        b.content.toLowerCase().includes(query) ||
        b.summary?.toLowerCase().includes(query) ||
        b.lang.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingByte(null);
    setFormData({
      title: "",
      content: "",
      link: "",
      summary: "",
      status: "draft",
      lang: "en",
    });
    editor?.commands.setContent("");
    setShowEditModal(true);
  };

  const openEditModal = (byte: QuickByte) => {
    setEditingByte(byte);
    setFormData({
      title: byte.title,
      content: byte.content,
      link: byte.link || "",
      summary: byte.summary || "",
      status: byte.status,
      lang: byte.lang,
    });
    editor?.commands.setContent(byte.content);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      showToast("error", "Title and content are required");
      return;
    }

    setSaving(true);
    try {
      const content = editor?.getHTML() || formData.content;
      const dataToSave = { ...formData, content };

      if (editingByte) {
        const updated = await updateQuickByte(editingByte.id, dataToSave);
        if (updated) {
          setBytes((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          );
          showToast("success", "Quick byte updated successfully!");
        }
      } else {
        const created = await createQuickByte(dataToSave);
        if (created) {
          setBytes((prev) => [created, ...prev]);
          showToast("success", "Quick byte created successfully!");
        }
      }
      setShowEditModal(false);
    } catch (err) {
      console.error("Error saving quick byte:", err);
      showToast("error", "Failed to save quick byte");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (byte: QuickByte) => {
    setDeletingByte(byte);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingByte) return;

    try {
      const success = await deleteQuickByte(deletingByte.id);
      if (success) {
        setBytes((prev) => prev.filter((b) => b.id !== deletingByte.id));
        showToast("success", "Quick byte deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting quick byte:", err);
      showToast("error", "Failed to delete quick byte");
    } finally {
      setShowDeleteModal(false);
      setDeletingByte(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/" className="text-[#3182ce] hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="bg-[#3182ce] p-2 rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <FileText className="text-white w-6 h-6" />
          </Link>
          <h1 className="text-xl font-medium">Quick Bytes</h1>
        </div>

        <div className="flex items-center gap-2">
          {user?.authenticated && user.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.user.user_metadata.full_name || "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#3182ce] flex items-center justify-center text-white text-xs">
                    {(
                      user.user.user_metadata.full_name ||
                      user.user.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium">
                  {user.user.user_metadata.full_name || user.user.email}
                </span>
                {user.isAdmin && (
                  <span className="text-xs text-[#3182ce] bg-[#3182ce]/10 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              <Link
                href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
                className="p-2 text-gray-500 hover:text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors"
                title="Account Settings"
              >
                <AlertCircle className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <Link
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/status?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
              className="px-4 py-2 text-[#3182ce] hover:bg-[#3182ce]/10 rounded-md transition-colors text-sm font-medium"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <button onClick={openCreateModal} className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Create Quick Byte</span>
            </button>

            <Link href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </Link>

            <Link href="/assets" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Assets</span>
            </Link>

            <Link href="/stats" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <BarChart3 className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Stats</span>
            </Link>
          </div>
        </section>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 justify-between flex-wrap mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "all"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              All ({bytes.length})
            </button>
            <button
              onClick={() => setFilter("published")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "published"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Published ({bytes.filter((b) => b.status === "published").length})
            </button>
            <button
              onClick={() => setFilter("draft")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                filter === "draft"
                  ? "bg-[#3182ce] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              Drafts ({bytes.filter((b) => b.status === "draft").length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group w-48">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
              <input
                type="text"
                placeholder="Search quick bytes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-[#3182ce]/20 transition-all outline-none"
              />
            </div>
            <button
              onClick={loadBytes}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Bytes List */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            All Quick Bytes ({filteredBytes.length})
          </h2>

          {loading && bytes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#3182ce] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBytes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No quick bytes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBytes.map((byte) => (
                <div
                  key={byte.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#3182ce] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {byte.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            byte.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {byte.status}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {byte.lang}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(byte.created_at).toLocaleDateString()}
                          {byte.updated_at && byte.updated_at !== byte.created_at && (
                            <span className="text-gray-400">
                              (updated {new Date(byte.updated_at).toLocaleDateString()})
                            </span>
                          )}
                        </span>
                        {byte.link && (
                          <span className="flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            <a
                              href={byte.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#3182ce] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              External Link
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => openEditModal(byte)}
                        className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(byte)}
                        className="p-1.5 bg-gray-100 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {byte.summary && (
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-3">
                      <p className="text-sm text-blue-800">{byte.summary}</p>
                    </div>
                  )}

                  <div
                    className="text-sm text-gray-700 line-clamp-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: byte.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingByte ? "Edit Quick Byte" : "Create Quick Byte"}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  placeholder="Enter title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.lang}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lang: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "draft" | "published",
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <textarea
                  value={formData.summary || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 resize-none"
                  placeholder="Brief summary of the quick byte..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External Link
                </label>
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.link || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                    placeholder="https://... (optional link to external source)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content * (Rich Text)
                </label>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        editor?.isActive("bold") ? "bg-gray-200" : ""
                      }`}
                      title="Bold"
                    >
                      <strong className="text-sm">B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        editor?.isActive("italic") ? "bg-gray-200" : ""
                      }`}
                      title="Italic"
                    >
                      <em className="text-sm">I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        editor?.isActive("underline") ? "bg-gray-200" : ""
                      }`}
                      title="Underline"
                    >
                      <u className="text-sm">U</u>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        editor?.isActive("strike") ? "bg-gray-200" : ""
                      }`}
                      title="Strikethrough"
                    >
                      <s className="text-sm">S</s>
                    </button>
                  </div>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title || !formData.content}
                className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {editingByte ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Quick Byte
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deletingByte?.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
