"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  Undo2,
  Send,
  Save,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import TiptapLink from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { createCampaign } from "@/supabase/CRUD/queries";
import { AuthResult } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { DEFAULT_TEMPLATES } from "@/types/email-template";
import TopNavbar from "@/components/TopNavbar";

interface CampaignFormPageProps {
  user?: AuthResult;
}

export default function CampaignFormPage({ user }: CampaignFormPageProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSubject, setRefinedSubject] = useState<string | null>(null);
  const [refinedBody, setRefinedBody] = useState<string | null>(null);
  const [originalSubject, setOriginalSubject] = useState("");
  const [originalBody, setOriginalBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Compose your email...",
      }),
      Underline,
      Strike,
      TiptapLink.configure({
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
    content: body,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setBody(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && body) {
      editor.commands.setContent(body);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setBody(template.body);
      if (editor) {
        editor.commands.setContent(template.body);
      }
    }
  };

  const handleRefine = async () => {
    if (!subject.trim() && !body.trim()) {
      showToast("error", "Write some content first before refining");
      return;
    }

    setIsRefining(true);
    setOriginalSubject(subject);
    setOriginalBody(body);

    try {
      const response = await fetch("/api/refine-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || undefined,
          body: body || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.error || "Failed to refine content");
        return;
      }

      if (data.subject) setRefinedSubject(data.subject);
      if (data.body) setRefinedBody(data.body);

      showToast("success", "Content refined! Review and accept or revert.");
    } catch (error) {
      console.error("Refine error:", error);
      showToast("error", "Failed to refine content");
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptRefinement = () => {
    if (refinedSubject) setSubject(refinedSubject);
    if (refinedBody) {
      setBody(refinedBody);
      if (editor) editor.commands.setContent(refinedBody);
    }
    setRefinedSubject(null);
    setRefinedBody(null);
    showToast("success", "Changes accepted!");
  };

  const handleRevertRefinement = () => {
    setSubject(originalSubject);
    setBody(originalBody);
    if (editor) editor.commands.setContent(originalBody);
    setRefinedSubject(null);
    setRefinedBody(null);
    showToast("success", "Reverted to original content.");
  };

  const handleSaveDraft = async () => {
    if (!subject.trim() || !body.trim()) {
      showToast("error", "Please fill in both subject and body");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createCampaign({
        subject,
        body,
        status: "draft",
      });

      if (created) {
        showToast("success", "Campaign saved as draft!");
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      showToast("error", "Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!subject.trim() || !body.trim()) {
      showToast("error", "Please fill in both subject and body");
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: 0 });

    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const result = await response.json();

      if (result.success) {
        setSendProgress({ sent: result.count || 0, total: result.count || 0 });
        showToast(
          "success",
          `Campaign queued! ${result.count} recipients will receive your email.`
        );
        setTimeout(() => router.push("/campaigns"), 1500);
      } else {
        showToast("error", result.error || "Failed to send campaign");
        setSendProgress(null);
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      showToast("error", "Failed to send campaign");
      setSendProgress(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="Create Campaign"
        icon={<Mail className="text-white w-6 h-6" />}
        user={user}
      />

      <main className="max-w-4xl mx-auto p-8">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            New Email Campaign
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
              >
                <option value="">Select a template...</option>
                {DEFAULT_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
                  placeholder="Email subject..."
                />
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={isRefining}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isRefining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Refine
                </button>
              </div>
              {refinedSubject && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                  <span className="text-xs text-purple-600 font-medium">
                    AI suggestion:
                  </span>
                  <span className="text-sm text-purple-800 flex-1">
                    {refinedSubject}
                  </span>
                  <button
                    type="button"
                    onClick={handleAcceptRefinement}
                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
                    title="Accept"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRevertRefinement}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                    title="Revert"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body * (Rich Text Editor)
              </label>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                {editor && (
                  <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => editor.chain().toggleBold().run()}
                      className={`p-1.5 rounded ${
                        editor.isActive("bold")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().toggleItalic().run()}
                      className={`p-1.5 rounded ${
                        editor.isActive("italic")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().toggleUnderline().run()}
                      className={`p-1.5 rounded ${
                        editor.isActive("underline")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().toggleStrike().run()}
                      className={`p-1.5 rounded ${
                        editor.isActive("strike")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <s>S</s>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => editor.chain().setParagraph().run()}
                      className={`p-1.5 rounded ${
                        editor.isActive("paragraph")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().toggleHeading({ level: 1 }).run()
                      }
                      className={`p-1.5 rounded ${
                        editor.isActive("heading", { level: 1 })
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().toggleHeading({ level: 2 }).run()
                      }
                      className={`p-1.5 rounded ${
                        editor.isActive("heading", { level: 2 })
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      H2
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt("Enter URL:");
                        if (url) {
                          editor.chain().setLink({ href: url }).run();
                        }
                      }}
                      className={`p-1.5 rounded ${
                        editor.isActive("link")
                          ? "bg-gray-200"
                          : "hover:bg-gray-100"
                      }`}
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
                      onClick={handleRefine}
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
                )}
                <div className="p-4 min-h-[300px] prose prose-sm max-w-none">
                  <EditorContent editor={editor} />
                </div>
                {refinedBody && (
                  <div className="border-t border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-600 font-medium">
                        AI has a suggested refinement for the body
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAcceptRefinement}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={handleRevertRefinement}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs font-medium"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Revert
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Save as draft to send later, or send
                immediately. Available template variables: {"{{site_url}}"},{" "}
                {"{{unsubscribe_url}}"}, {"{{article_1_url}}"}, etc.
              </p>
            </div>
          </div>

          {sendProgress && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Campaign queued for sending!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {sendProgress.sent} recipients will receive your email shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Link
              href="/campaigns"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving || isSending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleSendNow}
              disabled={isSaving || isSending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
