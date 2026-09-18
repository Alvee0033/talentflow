"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Columns,
  Table as TableIcon,
  Upload,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { candidatesApi } from "@/lib/api/candidates.api";
import { requisitionsApi } from "@/lib/api/requisitions.api";
import { ApplicationStage, STAGE_LABELS, STAGE_ORDER } from "@talentflow/shared";
import Link from "next/link";
import { toast } from "sonner";

export default function CandidatesPipelinePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReq, setSelectedReq] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN");

  // Advance modal state
  const [advancingApp, setAdvancingApp] = useState<any | null>(null);
  const [nextStage, setNextStage] = useState<string>("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Add Candidate modal state
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "MANUAL",
    currentTitle: "",
    requisitionId: "",
    notes: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleAddCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setDuplicateWarning(null);
    try {
      // Check duplicates first
      const dupCheck = await candidatesApi.checkDuplicates({
        email: addForm.email,
        phone: addForm.phone || undefined,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
      });
      if (dupCheck && dupCheck.isDuplicate) {
        setDuplicateWarning(
          `⚠️ Possible duplicate: ${dupCheck.matches?.map((m: any) => `${m.firstName} ${m.lastName} (${m.email})`).join(", ") || "existing candidate found"}`
        );
        setIsAdding(false);
        return;
      }

      // Create candidate
      const candidate = await candidatesApi.create({
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        phone: addForm.phone || undefined,
        source: addForm.source,
        currentTitle: addForm.currentTitle || undefined,
      });

      // Create application if requisition selected
      if (addForm.requisitionId) {
        await candidatesApi.createApplication({
          candidateId: candidate.id,
          requisitionId: addForm.requisitionId,
          notes: addForm.notes || undefined,
        });
      }

      toast.success(`Candidate ${addForm.firstName} ${addForm.lastName} added successfully`);
      setShowAddCandidate(false);
      setAddForm({ firstName: "", lastName: "", email: "", phone: "", source: "MANUAL", currentTitle: "", requisitionId: "", notes: "" });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to add candidate");
    } finally {
      setIsAdding(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, reqsRes] = await Promise.all([
        candidatesApi.getApplications({ limit: 100 }),
        requisitionsApi.getAll({ limit: 50 }),
      ]);
      setApplications(appsRes.items || []);
      setRequisitions(reqsRes.items || []);
    } catch (err: any) {
      toast.error("Failed to fetch applications from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdvanceStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancingApp || !nextStage) return;

    setIsAdvancing(true);
    try {
      await candidatesApi.transitionStage(advancingApp.id, nextStage, "Stage transitioned via Pipeline Board", advanceNotes);
      toast.success(`Candidate advanced to ${STAGE_LABELS[nextStage as ApplicationStage] || nextStage}`);
      setAdvancingApp(null);
      setAdvanceNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to advance stage");
    } finally {
      setIsAdvancing(false);
    }
  };

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const cand = app.candidate;
      if (!cand) return false;
      const fullName = `${cand.firstName} ${cand.lastName}`.toLowerCase();
      const matchSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        (cand.currentTitle && cand.currentTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cand.skills && cand.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchReq = selectedReq === "ALL" || app.requisitionId === selectedReq;
      return matchSearch && matchReq;
    });
  }, [applications, searchQuery, selectedReq]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7C66]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mockup Screen 3 Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Candidate Pipeline</h1>
          <p className="screen-sub">
            {selectedReq !== "ALL"
              ? requisitions.find((r) => r.id === selectedReq)?.title || "Requisition"
              : "Backend Engineer · REQ-1042"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="role-pill">Role: Recruiter</div>
          <Button
            size="sm"
            className="gap-1.5 font-semibold bg-[#0E7C66] hover:bg-[#0B6452] text-white"
            onClick={() => { setDuplicateWarning(null); setShowAddCandidate(true); }}
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </Button>
          <Link href="/candidates/import">
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold border-[#E2E5EA] text-[#1B2130] hover:bg-muted">
              <Upload className="h-4 w-4" /> Import Spreadsheet
            </Button>
          </Link>
          <div className="flex rounded-lg border border-[#E2E5EA] bg-muted/60 p-0.5">
            <button
              onClick={() => setViewMode("KANBAN")}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                viewMode === "KANBAN" ? "bg-background text-foreground shadow-sm" : "text-[#5B6577]"
              }`}
            >
              <Columns className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all ${
                viewMode === "TABLE" ? "bg-background text-foreground shadow-sm" : "text-[#5B6577]"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, position or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <select
          value={selectedReq}
          onChange={(e) => setSelectedReq(e.target.value)}
          className="h-9 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Requisitions</option>
          {requisitions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.requisitionNumber} - {r.title}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board View */}
      {viewMode === "KANBAN" ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGE_ORDER.map((stage) => {
            const stageApps = filteredApps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="w-72 shrink-0 flex flex-col rounded-xl border bg-card/60">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-xs font-bold">{STAGE_LABELS[stage]}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {stageApps.length}
                  </Badge>
                </div>
                <div className="p-2 space-y-2.5 flex-1 min-h-[400px]">
                  {stageApps.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
                      No candidates
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <Card key={app.id} className="p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <Link href={`/candidates/${app.candidateId}`} className="hover:underline font-bold text-xs">
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </Link>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{app.candidate?.currentTitle || "Applicant"}</p>
                        <p className="text-[10px] text-primary font-medium mt-1 truncate">
                          {app.requisition?.title}
                        </p>
                        <div className="mt-2.5 pt-2 border-t flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {app.candidate?.totalExperienceYears ? `${app.candidate.totalExperienceYears} yrs` : "N/A"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary"
                            onClick={() => {
                              setAdvancingApp(app);
                              const currIdx = STAGE_ORDER.indexOf(app.stage);
                              const next = currIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currIdx + 1] : "";
                              setNextStage(next);
                            }}
                          >
                            Advance <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-[10px]">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Requisition</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Experience</th>
                <th className="p-3">Next Action</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-muted/30">
                  <td className="p-3 font-semibold">
                    <Link href={`/candidates/${app.candidateId}`} className="hover:underline text-primary">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </Link>
                    <p className="text-[10px] text-muted-foreground">{app.candidate?.email}</p>
                  </td>
                  <td className="p-3">{app.requisition?.title || "General Application"}</td>
                  <td className="p-3">
                    <StatusBadge status={app.stage} label={STAGE_LABELS[app.stage as ApplicationStage]} />
                  </td>
                  <td className="p-3">{app.candidate?.totalExperienceYears ? `${app.candidate.totalExperienceYears} yrs` : "N/A"}</td>
                  <td className="p-3 text-muted-foreground">{app.nextAction || "None"}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setAdvancingApp(app);
                        const currIdx = STAGE_ORDER.indexOf(app.stage);
                        const next = currIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currIdx + 1] : "";
                        setNextStage(next);
                      }}
                    >
                      Advance Stage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Advance Modal */}
      {advancingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <form onSubmit={handleAdvanceStage} className="p-5 space-y-4">
              <h3 className="text-base font-bold">Advance Candidate Stage</h3>
              <p className="text-xs text-muted-foreground">
                Moving {advancingApp.candidate?.firstName} {advancingApp.candidate?.lastName} from{" "}
                <span className="font-semibold text-foreground">{STAGE_LABELS[advancingApp.stage as ApplicationStage]}</span>.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Destination Stage</label>
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="w-full h-9 rounded-md border text-xs px-3 bg-background"
                  required
                >
                  <option value="">Select Next Stage...</option>
                  {STAGE_ORDER.map((stg) => (
                    <option key={stg} value={stg}>
                      {STAGE_LABELS[stg]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Transition Notes</label>
                <textarea
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="Rationale or notes for stage transition audit..."
                  className="w-full rounded-md border p-2 text-xs bg-background h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdvancingApp(null)}
                  disabled={isAdvancing}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isAdvancing}>
                  {isAdvancing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Advance"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Add New Candidate</h2>
                <button
                  onClick={() => setShowAddCandidate(false)}
                  className="text-muted-foreground hover:text-foreground text-xl leading-none"
                >✕</button>
              </div>

              {duplicateWarning && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3 text-sm text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Duplicate Detected</p>
                    <p>{duplicateWarning}</p>
                    <button
                      className="mt-2 text-xs underline font-semibold"
                      onClick={() => { setDuplicateWarning(null); }}
                    >Dismiss and continue anyway</button>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddCandidateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">First Name *</label>
                    <Input
                      required
                      value={addForm.firstName}
                      onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="John"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Last Name *</label>
                    <Input
                      required
                      value={addForm.lastName}
                      onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Email *</label>
                  <Input
                    required
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone</label>
                    <Input
                      type="tel"
                      value={addForm.phone}
                      onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+880..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Current Title</label>
                    <Input
                      value={addForm.currentTitle}
                      onChange={e => setAddForm(f => ({ ...f, currentTitle: e.target.value }))}
                      placeholder="Software Engineer"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Source</label>
                    <select
                      value={addForm.source}
                      onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="MANUAL">Direct / Manual Entry</option>
                      <option value="CV_UPLOAD">CV Upload</option>
                      <option value="SPREADSHEET">Spreadsheet Import</option>
                      <option value="JOB_PORTAL">Job Portal / LinkedIn</option>
                      <option value="REFERRAL">Employee Referral</option>
                      <option value="INTERNAL_POOL">Internal Pool</option>
                      <option value="EVENT">Event / Career Fair</option>
                      <option value="HEADHUNTER">Headhunter / Agency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Link to Requisition</label>
                    <select
                      value={addForm.requisitionId}
                      onChange={e => setAddForm(f => ({ ...f, requisitionId: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">— None —</option>
                      {requisitions
                        .filter(r => r.status === "OPEN" || r.status === "APPROVED")
                        .map(r => (
                          <option key={r.id} value={r.id}>{r.requisitionNumber} — {r.title}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {addForm.requisitionId && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Application Notes</label>
                    <textarea
                      value={addForm.notes}
                      onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Initial screening notes, source details..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCandidate(false)}
                    disabled={isAdding}
                  >Cancel</Button>
                  <Button type="submit" size="sm" disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add Candidate
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}