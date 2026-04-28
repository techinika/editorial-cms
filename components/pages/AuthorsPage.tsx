"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  User,
  Shield,
  ToggleLeft,
  ToggleRight,
  FileText,
  ArrowLeft,
  Check,
  X,
  Building,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Author } from "@/types/author";
import { UserCompany } from "@/types/user-company";
import {
  getAllAuthorsWithRoles,
  updateAuthorRole,
  toggleAuthorAdmin,
  toggleAuthorActive,
  getCompanyRequests,
  getVerifiedUserCompanies,
  approveUserCompany,
  rejectUserCompany,
} from "@/supabase/CRUD/querries";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";
import UserNav from "@/components/UserNav";

interface AuthorsPageProps {
  user?: AuthResult;
}

export default function AuthorsPage({ user }: AuthorsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [companyRequests, setCompanyRequests] = useState<UserCompany[]>([]);
  const [verifiedCompanies, setVerifiedCompanies] = useState<UserCompany[]>([]);
  const [showCompanies, setShowCompanies] = useState(false);

  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    loadAuthors();
    if (isAdmin) {
      loadCompanyData();
    }
  }, []);

  const loadAuthors = async () => {
    setLoading(true);
    const data = await getAllAuthorsWithRoles(search || undefined);
    setAuthors(data);
    setLoading(false);
  };

  const loadCompanyData = async () => {
    const requests = await getCompanyRequests();
    const verified = await getVerifiedUserCompanies();
    setCompanyRequests(requests);
    setVerifiedCompanies(verified);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAuthors();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleApproveCompany = async (id: string) => {
    setSaving(id);
    const success = await approveUserCompany(id);
    setSaving(null);
    if (success) {
      showToast("success", "Company request approved");
      loadCompanyData();
    } else {
      showToast("error", "Failed to approve");
    }
  };

  const handleRejectCompany = async (id: string) => {
    setSaving(id);
    const success = await rejectUserCompany(id);
    setSaving(null);
    if (success) {
      showToast("success", "Company request rejected");
      loadCompanyData();
    } else {
      showToast("error", "Failed to reject");
    }
  };

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

  const authorsList = authors.filter(
    (a) => a.role === "author" || a.role === "manager",
  );
  const undecided = authors.filter((a) => a.role === "undecided");

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-[#3182ce] p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-medium">Blog CMS</h1>
          </div>
          <UserNav user={user} />
        </header>
        <div className="p-8 text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            You need admin access to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#3182ce] p-2 rounded-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-medium">Blog CMS</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCompanies(!showCompanies)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                showCompanies
                  ? "bg-[#3182ce] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Building className="w-4 h-4" />
              Companies
            </button>
          )}
          <UserNav user={user} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => {
                // Navigate to create author form or similar action
                showToast("info", "Author creation would be implemented here");
              }}
              className="group text-left"
            >
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Add New Author</span>
            </button>

            <Link href="/" className="group text-left">
              <div className="w-40 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
                <FileText
                  className="w-12 h-12 text-[#3182ce]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-sm font-medium">Articles</span>
            </Link>
          </div>
        </section>

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
                <Shield className="w-5 h-5" /> Authors & Managers (
                {authorsList.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Admin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {authorsList.map((author) => (
                      <tr key={author.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {author.imageAsset?.url ? (
                                <img
                                  src={author.imageAsset?.url}
                                  alt={author.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {author.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {author.username || "No username"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={author.role}
                            onChange={(e) =>
                              handleRoleChange(author.id, e.target.value)
                            }
                            disabled={saving === author.id}
                            className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 disabled:opacity-50"
                          >
                            <option value="author">Author</option>
                            <option value="manager">Manager</option>
                            <option value="undecided">Undecided</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleAdminToggle(author.id, !author.is_admin)
                            }
                            disabled={saving === author.id}
                            className={`flex items-center gap-1 ${author.is_admin ? "text-green-600" : "text-gray-400"}`}
                          >
                            {author.is_admin ? (
                              <Shield className="w-5 h-5" />
                            ) : (
                              <Shield className="w-5 h-5" />
                            )}
                            <span className="text-sm">
                              {author.is_admin ? "Yes" : "No"}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleActiveToggle(author.id, !author.active)
                            }
                            disabled={saving === author.id}
                            className={
                              author.active ? "text-green-600" : "text-red-600"
                            }
                          >
                            {author.active ? (
                              <ToggleRight className="w-8 h-5" />
                            ) : (
                              <ToggleLeft className="w-8 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {authorsList.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No authors found
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" /> Undecided ({undecided.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {undecided.map((author) => (
                      <tr key={author.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {author.imageAsset?.url ? (
                                <img
                                  src={author.imageAsset?.url}
                                  alt={author.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {author.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {author.username || "No username"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={author.role}
                            onChange={(e) =>
                              handleRoleChange(author.id, e.target.value)
                            }
                            disabled={saving === author.id}
                            className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 disabled:opacity-50"
                          >
                            <option value="author">Author</option>
                            <option value="manager">Manager</option>
                            <option value="undecided">Undecided</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleActiveToggle(author.id, !author.active)
                            }
                            disabled={saving === author.id}
                            className={
                              author.active ? "text-green-600" : "text-red-600"
                            }
                          >
                            {author.active ? (
                              <ToggleRight className="w-8 h-5" />
                            ) : (
                              <ToggleLeft className="w-8 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {undecided.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No undecided users found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCompanies && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-8 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" /> Verified Managers (
                {verifiedCompanies.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {verifiedCompanies.map((uc) => (
                      <tr key={uc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {uc.addedByUser?.name || "Unknown"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {uc.company?.name || "Unknown"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {uc.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {verifiedCompanies.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No verified managers
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" /> Company Requests (
                {companyRequests.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {companyRequests.map((uc) => (
                      <tr key={uc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {uc.addedByUser?.name || "Unknown"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {uc.company?.name || "Unknown"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              uc.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {uc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleApproveCompany(uc.id)}
                            disabled={saving === uc.id}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRejectCompany(uc.id)}
                            disabled={saving === uc.id}
                            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {companyRequests.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No pending requests
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
