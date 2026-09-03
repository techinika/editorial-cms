"use client";

import React from "react";
import {
  Plus,
  FileText,
  Tag,
  BarChart3,
  Clock,
  MessageCircle,
  Image,
  User,
  Calendar,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResult } from "@/lib/auth";

interface QuickActionsProps {
  user?: AuthResult;
}

interface ActionCardProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
}

function ActionCard({ href, onClick, icon, label }: ActionCardProps) {
  const content = (
    <div className="w-40 h-52 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#3182ce] transition-all shadow-sm group-hover:shadow-md mb-2">
      {icon}
    </div>
  );

  return href ? (
    <Link href={href} className="group text-left">
      {content}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  ) : (
    <button className="group text-left" onClick={onClick}>
      {content}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function QuickActions({ user }: QuickActionsProps) {
  const router = useRouter();

  return (
    <section className="mb-12">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-6">
        <ActionCard
          onClick={() => router.push("/create")}
          icon={<Plus className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Create New Article"
        />
        <ActionCard
          href="/events/new"
          icon={<Calendar className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="New Event"
        />
        <ActionCard
          href="/article-companies"
          icon={<Link2 className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Article Matches"
        />
        <ActionCard
          href="/categories"
          icon={<Tag className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Categories"
        />
        <ActionCard
          href="/stats"
          icon={<BarChart3 className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="My Stats"
        />
        <ActionCard
          href="/comments"
          icon={<MessageCircle className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Comments"
        />
        <ActionCard
          href="/pending"
          icon={<Clock className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Pending Review"
        />
        <ActionCard
          href="/assets"
          icon={<Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Assets"
        />
        {user?.isAdmin && (
          <ActionCard
            href="/ads"
            icon={<Image className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
            label="Ads"
          />
        )}
        {user?.isAdmin && (
          <ActionCard
            href="/authors"
            icon={<User className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
            label="Authors"
          />
        )}
        {user?.isAdmin && (
          <ActionCard
            href="/queries"
            icon={<MessageCircle className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
            label="Queries"
          />
        )}
        <ActionCard
          href="/bytes"
          icon={<FileText className="w-12 h-12 text-[#3182ce]" strokeWidth={1.5} />}
          label="Quick Bytes"
        />
      </div>
    </section>
  );
}
