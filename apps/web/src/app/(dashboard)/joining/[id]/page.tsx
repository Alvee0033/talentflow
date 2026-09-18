"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Building,
  Laptop,
  Check,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { joiningApi } from "@/lib/api/joining.api";
import { toast } from "sonner";

export default function CandidateJoiningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [checklist, setChecklist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      let data = null;
      try {
        data = await joiningApi.getById(profileId);
      } catch {
        data = await joiningApi.getByApplicationId(profileId);
      }
      setChecklist(data);
    } catch (err: any) {
      toast.error("Failed to load onboarding checklist details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profileId]);

  const handleUpdateItem = async (itemId: string, newStatus: string) => {
    if (!checklist?.id) return;
    setActionLoading(true);
    try {
      await joiningApi.updateItem(checklist.id, itemId, { status: newStatus });
      toast.success("Checklist item updated!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteChecklist = async () => {
    if (!checklist?.id) return;
    setActionLoading(true);
    try {
      await joiningApi.complete(checklist.id);
      toast.success("Candidate onboarding marked as 100% completed!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete checklist");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold">Onboarding checklist not found</h2>
        <p className="text-xs text-muted-foreground">The requested record does not exist.</p>
        <Link href="/joining">
          <Button size="sm" variant="outline" className="text-xs">
            Back to Joining Hub
          </Button>
        </Link>
      </div>
    );
  }

  const cand = checklist.application?.candidate;
  const candName = cand ? `${cand.firstName} ${cand.lastName}` : "Candidate";
  const req = checklist.application?.requisition;
  const items = checklist.items || [];
  const completedCount = items.filter((i: any) => i.status === "COMPLETED").length;
  const totalCount = items.length || 13;
  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/joining"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Joining Overview
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={checklist.status} />
          {checklist.status !== "COMPLETED" && (
            <Button
              size="sm"
              onClick={handleCompleteChecklist}
              disabled={actionLoading}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Mark Checklist Complete
            </Button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-card via-card to-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{candName}</h1>
                <Badge variant="outline" className="text-xs">
                  {req?.title || "Role"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Department: {req?.department?.name || "Corporate"} &bull; Contact: {cand?.email || "N/A"}
              </p>
              {checklist.targetJoiningDate && (
                <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-1">
                  <Calendar className="h-4 w-4" />
                  Target Joining Date: {new Date(checklist.targetJoiningDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Readiness Widget */}
            <div className="rounded-xl border bg-card p-4 min-w-[220px] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Overall Readiness:</span>
                <span className="font-bold text-foreground">{percent}%</span>
              </div>
              <Progress value={percent} className="h-2.5" />
              <div className="text-[11px] text-muted-foreground">
                {completedCount} of {totalCount} mandatory points satisfied
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 13-Point Checklist Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            13-Point Corporate Pre-Boarding Governance
          </CardTitle>
          <CardDescription className="text-xs">
            Mandatory operational compliance across IT provisioning, facilities, HR induction, and documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-xs">
            {items.map((item: any, idx: number) => {
              const isDone = item.status === "COMPLETED";

              return (
                <div
                  key={item.id || idx}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateItem(item.id, isDone ? "PENDING" : "COMPLETED")}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-muted-foreground/30 hover:border-primary"
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.itemType?.replace(/_/g, " ")}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.notes || "Operational check required prior to Day-1 orientation"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <select
                      value={item.status}
                      disabled={actionLoading}
                      onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="NOT_APPLICABLE">Not Applicable</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}