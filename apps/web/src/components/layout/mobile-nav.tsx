"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { title: "Home", href: "/", icon: LayoutDashboard },
    { title: "Requisitions", href: "/requisitions", icon: Briefcase },
    { title: "Candidates", href: "/candidates", icon: Users },
    { title: "Interviews", href: "/interviews", icon: Calendar },
    { title: "Messages", href: "/messages", icon: MessageSquare },
    { title: "Joining", href: "/joining", icon: ClipboardCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md px-2 py-1 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 mb-0.5", isActive && "stroke-[2.5]")} />
            <span className="truncate">{item.title}</span>
          </a>
        );
      })}
    </nav>
  );
}