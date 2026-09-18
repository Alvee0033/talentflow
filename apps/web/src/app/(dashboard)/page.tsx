"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { RecruiterDashboard } from "@/components/dashboard/recruiter-dashboard";
import { TAHeadDashboard } from "@/components/dashboard/ta-head-dashboard";
import { DeptHeadDashboard } from "@/components/dashboard/dept-head-dashboard";
import { CardGridLoadingSkeleton } from "@/components/shared/loading-state";
import { useRouter } from "next/navigation";

export default function DashboardHomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full rounded-2xl bg-muted/40 animate-pulse" />
        <CardGridLoadingSkeleton count={4} />
      </div>
    );
  }

  // Render dashboard based on actual authenticated user roles
  if (user.roles?.includes("TA_ADMIN") || user.roles?.includes("TECH_ADMIN")) {
    return <TAHeadDashboard />;
  }

  if (user.roles?.includes("DEPT_HEAD")) {
    return <DeptHeadDashboard />;
  }

  // Default to Recruiter Dashboard
  return <RecruiterDashboard />;
}