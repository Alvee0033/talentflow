"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  Calendar,
  Users,
  Star,
  ShieldCheck,
  Check,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { requisitionsApi } from "@/lib/api/requisitions.api";
import { candidatesApi } from "@/lib/api/candidates.api";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reqId = params?.id as string;

  const [req, setReq] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!reqId) return;
    setLoading(true);
    try {
      const [reqData, appsData] = await Promise.all([
        requisitionsApi.getById(reqId),
        candidatesApi.getApplications({ requisitionId: reqId, limit: 50 }).catch(() => ({ items: [] })),
      ]);
      setReq(reqData);
      setApplications(appsData?.items || []);
    } catch (err: any) {
      toast.error("Failed to load requisition details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reqId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await requisitionsApi.approve(reqId, "Approved by authorized stakeholder");
      toast.success("Requisition approved successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve requisition");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setActionLoading(true);
    try {
      await requisitionsApi.reject(reqId, reason);
      toast.success("Requisition rejected");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject requisition");
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

  if (!req) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold">Requisition not found</h2>
        <p className="text-xs text-muted-foreground">The requested requisition ID does not exist or has been deleted.</p>
        <Link href="/requisitions">
          <Button size="sm" variant="outline" className="text-xs">
            Back to Requisitions
          </Button>
        </Link>
      </div>
    );
  }

  const skillsList = Array.isArray(req.skills)
    ? req.skills
    : typeof req.skills === "string"
    ? req.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const filledCount = req.filledVacancies || 0;
  const vacancies = req.vacancies || 1;
  const fillPercent = Math.min(100, Math.round((filledCount / vacancies) * 100));

  return (
    <div className="space-y-6">
      {/* Mockup Topline */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Requisition Workspace</h1>
          <p className="screen-sub">
            {req.requisitionNumber} · {req.title}
          </p>
        </div>
        <div className="role-pill">
          Role: {user?.roles?.[0]?.replace("_", " ") || "Recruiter"}
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="badge badge-teal">{req.status}</span>
        {req.priority && <span className="badge badge-blue">{req.priority}</span>}
        {req.status === "AWAITING_APPROVAL" && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1"
              onClick={handleReject}
              disabled={actionLoading}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-[#0E7C66] hover:bg-[#0B6452] text-white gap-1 font-semibold"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              <Check className="h-3.5 w-3.5" /> Approve Requisition
            </Button>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-card via-card to-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{req.title}</h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {req.requisitionNumber}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {req.department?.name || "Department"} &bull; Location: {req.location || "Dhaka Head Office"} &bull; Level: {req.experienceLevel || "Mid-Senior"}
              </p>
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skillsList.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Vacancy Progress Widget */}
            <div className="rounded-xl border bg-card p-4 min-w-[240px] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Vacancy Fulfillment:</span>
                <span className="font-bold text-foreground">
                  {filledCount} of {vacancies} Filled
                </span>
              </div>
              <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                <span>Target: <strong className="text-foreground">{req.targetDate ? new Date(req.targetDate).toLocaleDateString() : "TBD"}</strong></span>
                <span className="text-primary font-bold">{applications.length} in pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Specifications & Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-primary" /> Business Unit & Team
          </span>
          <div className="text-xs font-semibold text-foreground">
            {req.department?.businessUnit?.name || "Anwar Group"}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Department: {req.department?.name || "N/A"}
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Budget & Compensation
          </span>
          <div className="text-xs font-semibold text-foreground">
            {req.minSalary && req.maxSalary
              ? `${req.currency || 'BDT'} ${Number(req.minSalary).toLocaleString()} - ${Number(req.maxSalary).toLocaleString()}`
              : "Competitive / According to Policy"}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Employment: {req.employmentType || "Full-Time"}
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-purple-600" /> Stakeholders
          </span>
          <div className="text-xs font-semibold text-foreground">
            Recruiter: {req.assignedRecruiter ? `${req.assignedRecruiter.firstName} ${req.assignedRecruiter.lastName}` : "Unassigned"}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Hiring Manager: {req.hiringManager ? `${req.hiringManager.firstName} ${req.hiringManager.lastName}` : "Pending"}
          </p>
        </Card>
      </div>

      {/* Requisition Description */}
      {req.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Role Description & Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {req.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Linked Candidates Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active Candidates Linked to Requisition ({applications.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Applicants currently progressing through the evaluation rounds
            </CardDescription>
          </div>
          <Link href="/candidates">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Open Kanban Board &rarr;
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              No candidates applied for this requisition yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Applied Date</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Next Action</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/20">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{app.candidate?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={app.stage} />
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {app.rating || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-muted-foreground">
                        {app.nextAction || "None specified"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/candidates/${app.candidateId || app.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Workspace &rarr;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}