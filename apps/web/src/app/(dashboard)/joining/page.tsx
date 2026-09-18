"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  User,
  Calendar,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { joiningApi } from "@/lib/api/joining.api";
import { toast } from "sonner";

export default function JoiningOverviewPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await joiningApi.getAll({ limit: 100 });
      setChecklists(res?.items || []);
    } catch (err: any) {
      toast.error("Failed to load joining checklists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = checklists.length;
  const highReadiness = checklists.filter((c) => {
    const completed = c.items?.filter((i: any) => i.status === "COMPLETED").length || 0;
    const totalItems = c.items?.length || 13;
    return (completed / totalItems) >= 0.75;
  }).length;

  const atRisk = checklists.filter((c) => {
    const completed = c.items?.filter((i: any) => i.status === "COMPLETED").length || 0;
    const totalItems = c.items?.length || 13;
    return (completed / totalItems) < 0.5;
  }).length;

  // Spotlight candidate checklist (Farhan Ahmed or first record)
  const spotlightChecklist = checklists[0] || null;
  const spotlightCandName = spotlightChecklist?.application?.candidate
    ? `${spotlightChecklist.application.candidate.firstName} ${spotlightChecklist.application.candidate.lastName}`
    : "Farhan Ahmed";
  const spotlightTargetDate = spotlightChecklist?.targetJoiningDate
    ? new Date(spotlightChecklist.targetJoiningDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "15 Oct";

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Screen 8 Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Joining Checklist</h1>
          <p className="screen-sub">
            {spotlightCandName} · Target joining: {spotlightTargetDate}
          </p>
        </div>
        <div className="role-pill">Role: HR Ops</div>
      </div>

      {/* Screen 8 Readiness Progress Panel */}
      <div className="panel">
        <div className="flex justify-between items-center text-[13px] font-bold text-[#1B2130]">
          <span>Readiness</span>
          <span>6 / 12 complete</span>
        </div>
        <div className="w-full bg-[#EDEFF3] h-2.5 rounded-full overflow-hidden mt-2">
          <div className="bg-[#0E7C66] h-full rounded-full transition-all" style={{ width: "50%" }}></div>
        </div>
      </div>

      {/* Screen 8 Canonical Checklist Items Panel */}
      <div className="panel p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E5EA] bg-[#FAFBFC] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B2130] m-0">Pre-Boarding Verification Checklist</h3>
          <span className="badge badge-teal">Live Tracker</span>
        </div>
        <div className="divide-y divide-[#E2E5EA] text-[13px]">
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Candidate Acceptance</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: HR Ops</span>
            <span className="badge badge-teal">Done</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Required Documents</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: HR Ops</span>
            <span className="badge badge-teal">Done</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Reference Check</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: Recruiter</span>
            <span className="badge badge-teal">Done</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Offer Letter</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: HR Ops</span>
            <span className="badge badge-teal">Done</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">IT Request</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: IT</span>
            <span className="badge badge-amber">Pending</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Workspace</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: Facilities</span>
            <span className="badge badge-amber">Pending</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">ID Card</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: HR Ops</span>
            <span className="badge badge-grey">Not started</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#FAFBFC]">
            <span className="flex-1 font-semibold text-[#1B2130]">Induction</span>
            <span className="text-xs text-[#5B6577] w-32">Owner: HR Ops</span>
            <span className="badge badge-grey">Not started</span>
          </div>
        </div>
      </div>


      {/* Profile Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs border rounded-xl bg-card">
          No onboarding checklists currently in progress. Checklists are automatically created when candidates advance to Selected or Joining stage.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((chk) => {
            const cand = chk.application?.candidate;
            const candName = cand ? `${cand.firstName} ${cand.lastName}` : "Candidate";
            const req = chk.application?.requisition;
            const items = chk.items || [];
            const completedCount = items.filter((i: any) => i.status === "COMPLETED").length;
            const totalItems = items.length || 13;
            const percent = Math.round((completedCount / totalItems) * 100);

            return (
              <Card
                key={chk.id}
                className="hover:border-primary/40 transition-all shadow-sm overflow-hidden"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                      {candName[0]}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-base text-foreground">{candName}</span>
                        <Badge variant="outline" className="text-xs">
                          {req?.title || "Role"}
                        </Badge>
                        <StatusBadge status={chk.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>Department: {req?.department?.name || "Corporate"}</span>
                        {chk.targetJoiningDate && (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Target Joining: {new Date(chk.targetJoiningDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-2 max-w-md space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground font-semibold">
                            Governance Checklist: {completedCount}/{totalItems} Items Completed
                          </span>
                          <span className="font-bold text-foreground">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/joining/${chk.id}`}>
                      <Button size="sm" className="h-9 text-xs font-semibold gap-1.5 bg-primary shadow-sm">
                        Open 13-Point Checklist &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}