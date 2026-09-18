"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.roles?.some((r) => r === "TECH_ADMIN" || r === "TA_ADMIN");

  const navItems = [
    {
      num: "1",
      title: "Recruiter Dashboard",
      href: "/",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN", "PANEL_MEMBER"],
    },
    {
      num: "2",
      title: "Requisition Workspace",
      href: "/requisitions",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN"],
    },
    {
      num: "3",
      title: "Candidate Pipeline",
      href: "/candidates",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN"],
    },
    {
      num: "4",
      title: "Candidate Workspace",
      href: "/candidates/workspace",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN"],
    },
    {
      num: "5",
      title: "Interview Scheduling",
      href: "/interviews",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN", "PANEL_MEMBER"],
    },
    {
      num: "6",
      title: "Interview Evaluation",
      href: "/interviews/evaluate",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN", "PANEL_MEMBER"],
    },
    {
      num: "7",
      title: "Message Approval",
      href: "/messages",
      roles: ["RECRUITER", "TA_ADMIN", "TECH_ADMIN"],
    },
    {
      num: "8",
      title: "Joining Checklist",
      href: "/joining",
      roles: ["RECRUITER", "TA_ADMIN", "DEPT_HEAD", "TECH_ADMIN"],
    },
    {
      num: "9",
      title: "Management Dashboard",
      href: "/dashboard/management",
      roles: ["TA_ADMIN", "TECH_ADMIN", "DEPT_HEAD", "HR_LEADERSHIP", "RECRUITER"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !user || item.roles.some((r) => user.roles?.includes(r))
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#233247] text-[#D9E0EA] transition-all duration-300 select-none z-20 h-screen",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          {!collapsed ? (
            <div className="text-[17px] font-bold text-white tracking-[0.2px]">
              Talent<span className="text-[#7FD9C4]">Flow</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0E7C66] text-white font-black text-xs">
              TF
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded border border-white/10 text-[#C4CCDA] hover:text-white hover:bg-white/5"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Role Context Pill */}
      {!collapsed && user && (
        <div className="px-5 py-2.5 bg-black/15 border-b border-white/5">
          <div className="text-[10px] font-semibold text-[#8B98AD] uppercase tracking-wider">
            Current Workspace
          </div>
          <div className="text-xs font-semibold text-[#E2E8F0] truncate mt-0.5">
            {user.roles?.[0]?.replace("_", " ") || "Authorized Staff"}
          </div>
        </div>
      )}

      {/* Navigation List - 9 Canonical Screens */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {filteredNavItems.map((item) => {
          let isActive = false;
          if (item.href === "/") {
            isActive = pathname === "/" || pathname === "/dashboard";
          } else if (item.href === "/candidates/workspace") {
            isActive = pathname === "/candidates/workspace" || (pathname.startsWith("/candidates/") && pathname !== "/candidates" && pathname !== "/candidates/import");
          } else if (item.href === "/interviews/evaluate") {
            isActive = pathname.includes("/evaluate");
          } else if (item.href === "/candidates") {
            isActive = pathname === "/candidates" || pathname === "/candidates/import";
          } else {
            isActive = pathname.startsWith(item.href);
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? `${item.num}. ${item.title}` : undefined}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] cursor-pointer border-l-[3px] transition-all",
                isActive
                  ? "bg-white/[0.09] text-white border-l-[#0E7C66] font-semibold"
                  : "text-[#C4CCDA] border-l-transparent hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <span
                className={cn(
                  "text-[11px] w-[19px] h-[19px] rounded-full flex items-center justify-center shrink-0 font-bold transition-all",
                  isActive
                    ? "bg-[#0E7C66] text-[#0B2620]"
                    : "bg-white/[0.12] text-[#D9E0EA]"
                )}
              >
                {item.num}
              </span>
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* System Administration Sub-Navigation (Admins only) */}
      {!collapsed && isAdmin && (
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8B98AD] px-2">
            <span>Administration</span>
            <ShieldCheck className="h-3.5 w-3.5 text-[#7FD9C4]" />
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
            <Link href="/admin/users" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Users
            </Link>
            <Link href="/admin/roles" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Roles & Perms
            </Link>
            <Link href="/admin/organization" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Org Structure
            </Link>
            <Link href="/admin/templates" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Templates
            </Link>
            <Link href="/admin/evaluation-forms" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Scorecards
            </Link>
            <Link href="/admin/approval-flows" className="p-1.5 rounded hover:bg-white/10 text-[#CBD5E1] hover:text-white">
              Workflows
            </Link>
          </div>
          <div className="pt-1 border-t border-white/5">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#CBD5E1] hover:text-white hover:bg-white/10"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}