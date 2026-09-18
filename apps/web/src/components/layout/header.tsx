"use client";

import React, { useState } from "react";
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Menu,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const getPrimaryRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return "User";
    const r = user.roles[0];
    switch (r) {
      case "RECRUITER":
        return "Recruiter";
      case "TA_ADMIN":
        return "TA Head";
      case "DEPT_HEAD":
        return "Dept Head";
      case "TECH_ADMIN":
        return "Admin";
      default:
        return r;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {user ? `${user.firstName} ${user.lastName}` : "Anwar TalentFlow"}
          </span>
          <Badge variant="outline" className="text-[11px] font-medium uppercase tracking-wider">
            {getPrimaryRole()}
          </Badge>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle visual theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2.5 rounded-full border border-border/80 bg-background/50 p-1 pr-3 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "TF"}
            </div>
            <span className="hidden text-xs font-semibold sm:inline-block max-w-[120px] truncate">
              {user?.email}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {isProfileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setIsProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-xs font-bold text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span key={r} className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}