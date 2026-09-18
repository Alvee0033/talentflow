"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { useAuth } from "@/providers/auth-provider";

export function DeptHeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getDeptHeadDashboard()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to load department head dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-500/15 via-blue-500/5 to-background border p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Department Head Portal
            </h1>
            <Badge variant="info" className="text-[11px]">
              {data?.department?.name || "Department"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Strictly scoped overview of requisitions and candidates for your department.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Dept Requisitions</span>
          <p className="text-2xl font-black text-foreground mt-2">{data?.activeRequisitionsCount || 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Dept Candidates</span>
          <p className="text-2xl font-black text-primary mt-2">{data?.totalCandidatesCount || 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Upcoming Interviews</span>
          <p className="text-2xl font-black text-amber-600 mt-2">{data?.upcomingInterviews?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Joining Readiness</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">{data?.joiningReadiness?.length || 0}</p>
        </Card>
      </div>

      {/* Department Requisitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Active Department Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {(!data?.requisitions || data.requisitions.length === 0) ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active positions in your department.</p>
            ) : (
              data.requisitions.map((r: any) => (
                <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">{r.title}</span>
                    <span className="text-muted-foreground ml-2">({r.requisitionNumber})</span>
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
