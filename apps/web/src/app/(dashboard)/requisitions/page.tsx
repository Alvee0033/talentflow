"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { requisitionsApi } from "@/lib/api/requisitions.api";
import { organizationApi } from "@/lib/api/admin.api";
import Link from "next/link";
import { toast } from "sonner";

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Recruiter assignment state
  const [assigningReq, setAssigningReq] = useState<any | null>(null);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqsRes, usersRes] = await Promise.all([
        requisitionsApi.getAll({ limit: 100 }),
        organizationApi.getUsers({ role: "RECRUITER" }).catch(() => ({ items: [] })),
      ]);
      setRequisitions(reqsRes.items || []);
      setRecruiters(usersRes.items || []);
    } catch (err: any) {
      toast.error("Failed to load requisitions from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReq || !selectedRecruiterId) return;

    setIsAssigning(true);
    try {
      await requisitionsApi.assignRecruiter(assigningReq.id, selectedRecruiterId);
      toast.success("Recruiter successfully assigned to requisition");
      setAssigningReq(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to assign recruiter");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredReqs = requisitions.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requisitionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.department?.name && r.department.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Job Requisitions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage headcount requirements, approval workflows, and recruiter assignments
          </p>
        </div>
        <Link href="/requisitions/new">
          <Button size="sm" className="gap-1.5 shadow-sm font-semibold">
            <Plus className="h-4 w-4" /> Create Requisition
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, REQ number, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="DRAFT">Draft</option>
          <option value="FILLED">Filled</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Requisitions Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-[10px]">
            <tr>
              <th className="p-3">Req Number</th>
              <th className="p-3">Position & Business Unit</th>
              <th className="p-3">Department</th>
              <th className="p-3">Headcount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Assigned Recruiter</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredReqs.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="p-3 font-mono font-bold text-foreground">
                  <Link href={`/requisitions/${r.id}`} className="hover:underline text-primary">
                    {r.requisitionNumber}
                  </Link>
                </td>
                <td className="p-3">
                  <div className="font-bold text-foreground">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground">{r.businessUnit?.name || "Anwar Group"}</div>
                </td>
                <td className="p-3 font-medium">{r.department?.name || "N/A"}</td>
                <td className="p-3 font-semibold">{r.headcount} Open</td>
                <td className="p-3">
                  <StatusBadge status={r.status} label={r.status.replace("_", " ")} />
                </td>
                <td className="p-3">
                  {r.assignedRecruiter ? (
                    <span className="font-medium">
                      {r.assignedRecruiter.firstName} {r.assignedRecruiter.lastName}
                    </span>
                  ) : (
                    <span className="text-amber-600 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAssigningReq(r);
                      setSelectedRecruiterId(r.assignedRecruiterId || "");
                    }}
                  >
                    Assign Recruiter
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recruiter Assignment Modal */}
      {assigningReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <form onSubmit={handleAssignRecruiter} className="p-5 space-y-4">
              <h3 className="text-base font-bold">Assign Recruiter</h3>
              <p className="text-xs text-muted-foreground">
                Assigning responsible talent partner for <strong className="text-foreground">{assigningReq.title}</strong> ({assigningReq.requisitionNumber}).
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Recruiter</label>
                <select
                  value={selectedRecruiterId}
                  onChange={(e) => setSelectedRecruiterId(e.target.value)}
                  className="w-full h-9 rounded-md border text-xs px-3 bg-background"
                  required
                >
                  <option value="">Select Recruiter...</option>
                  {recruiters.length === 0 ? (
                    <option value="fbf76248-86bb-4a6b-856d-499c1dbec76d">Sarah Jenkins (recruiter@talentflow.anwargroup.com)</option>
                  ) : (
                    recruiters.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.firstName} {rec.lastName} ({rec.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningReq(null)}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isAssigning}>
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}