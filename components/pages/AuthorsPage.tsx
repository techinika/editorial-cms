"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Check, Loader2, User, Shield, UserMinus, UserPlus, ToggleLeft, ToggleRight } from "lucide-react";
import { Author } from "@/types/author";
import { getAllAuthorsWithRoles, updateAuthorRole, toggleAuthorAdmin, toggleAuthorActive, createAuthor, deleteAuthor } from "@/supabase/CRUD/querries";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";

interface AuthorsPageProps {
  user?: AuthResult;
}

export default function AuthorsPage({ user }: AuthorsPageProps) {
  const { showToast } = useToast();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    setLoading(true);
    const data = await getAllAuthorsWithRoles(search || undefined);
    setAuthors(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAuthors();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRoleChange = async (authorId: string, role: string) => {
    if (!isAdmin) return;
    setSaving(authorId);
    const success = await updateAuthorRole(authorId, role);
    setSaving(null);
    if (success) {
      showToast("success", "Role updated");
      loadAuthors();
    } else {
      showToast("error", "Failed to update role");
    }
  };

  const handleAdminToggle = async (authorId: string, isAdminValue: boolean) => {
    if (!isAdmin) return;
    setSaving(authorId);
    const success = await toggleAuthorAdmin(authorId, isAdminValue);
    setSaving(null);
    if (success) {
      showToast("success", isAdminValue ? "Admin granted" : "Admin removed");
      loadAuthors();
    } else {
      showToast("error", "Failed to update admin");
    }
  };

  const handleActiveToggle = async (authorId: string, active: boolean) => {
    if (!isAdmin) return;
    setSaving(authorId);
    const success = await toggleAuthorActive(authorId, active);
    setSaving(null);
    if (success) {
      showToast("success", active ? "User activated" : "User deactivated");
      loadAuthors();
    } else {
      showToast("error", "Failed to update status");
    }
  };

  const authorsList = authors.filter(a => a.role === "author" || a.role === "manager");
  const readers = authors.filter(a => a.role === "reader");

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2">You need admin access to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Authors & Users</h1>
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Authors & Managers ({authorsList.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {authorsList.map((author) => (
                      <tr key={author.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {author.image_url ? (
                                <img src={author.image_url} alt={author.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{author.name}</p>
                              <p className="text-sm text-gray-500">{author.username || "No username"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={author.role}
                            onChange={(e) => handleRoleChange(author.id, e.target.value)}
                            disabled={saving === author.id}
                            className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 disabled:opacity-50"
                          >
                            <option value="reader">Reader</option>
                            <option value="author">Author</option>
                            <option value="manager">Manager</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleAdminToggle(author.id, !author.is_admin)}
                            disabled={saving === author.id}
                            className={`flex items-center gap-1 ${author.is_admin ? "text-green-600" : "text-gray-400"}`}
                          >
                            {author.is_admin ? <Shield className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                            <span className="text-sm">{author.is_admin ? "Yes" : "No"}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleActiveToggle(author.id, !author.active)}
                            disabled={saving === author.id}
                            className={author.active ? "text-green-600" : "text-red-600"}
                          >
                            {author.active ? (
                              <ToggleRight className="w-8 h-5" />
                            ) : (
                              <ToggleLeft className="w-8 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRoleChange(author.id, "reader")}
                            disabled={saving === author.id}
                            className="text-red-600 hover:text-red-700 text-sm"
                            title="Remove author role"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {authorsList.length === 0 && (
                  <div className="py-8 text-center text-gray-500">No authors found</div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" /> Readers ({readers.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {readers.map((author) => (
                      <tr key={author.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {author.image_url ? (
                                <img src={author.image_url} alt={author.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{author.name}</p>
                              <p className="text-sm text-gray-500">{author.username || "No username"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleActiveToggle(author.id, !author.active)}
                            disabled={saving === author.id}
                            className={author.active ? "text-green-600" : "text-red-600"}
                          >
                            {author.active ? (
                              <ToggleRight className="w-8 h-5" />
                            ) : (
                              <ToggleLeft className="w-8 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRoleChange(author.id, "author")}
                            disabled={saving === author.id}
                            className="text-[#3182ce] hover:text-[#2c5282] text-sm flex items-center gap-1"
                            title="Make author"
                          >
                            <UserPlus className="w-5 h-5" /> Make Author
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {readers.length === 0 && (
                  <div className="py-8 text-center text-gray-500">No readers found</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}