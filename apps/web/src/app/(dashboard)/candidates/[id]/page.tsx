"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  DollarSign,
  Star,
  Loader2,
  X,
  History,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { candidatesApi } from "@/lib/api/candidates.api";
import { ApplicationStage, STAGE_LABELS, STAGE_ORDER, VALID_STAGE_TRANSITIONS } from "@talentflow/shared";
import { toast } from "sonner";

export default function CandidateWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any | null>(null);
  const [application, setApplication] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Advance modal state
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [selectedNextStage, setSelectedNextStage] = useState<string>("");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState("");
  const [isSubmittingStage, setIsSubmittingStage] = useState(false);

  // Reject modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const loadCandidateData = async () => {
    if (!rawId) return;
    setLoading(true);
    try {
      // First try fetching as Application
      let appData: any = null;
      let candData: any = null;

      try {
        appData = await candidatesApi.getApplicationById(rawId);
        candData = appData?.candidate;
      } catch {
        // If not an application ID, try as candidate ID
        candData = await candidatesApi.getById(rawId);
        if (candData?.applications && candData.applications.length > 0) {
          appData = await candidatesApi.getApplicationById(candData.applications[0].id);
        }
      }

      setCandidate(candData);
      setApplication(appData);

      if (appData?.id) {
        try {
          const hist = await candidatesApi.getStageHistory(appData.id);
          setHistory(hist || []);
        } catch {
          setHistory(appData.stageHistories || []);
        }

        // Set default next valid stage
        const currentStage = (appData.stage as ApplicationStage) || ApplicationStage.NEW;
        const validNext = VALID_STAGE_TRANSITIONS[currentStage] || [];
        if (validNext.length > 0) {
          setSelectedNextStage(validNext[0]);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load candidate profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateData();
  }, [rawId]);

  const handleAdvanceStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.id || !selectedNextStage) return;

    setIsSubmittingStage(true);
    try {
      await candidatesApi.transitionStage(
        application.id,
        selectedNextStage,
        "Advancing candidate",
        transitionNotes,
        nextAction || undefined,
        nextActionDueDate ? new Date(nextActionDueDate).toISOString() : undefined
      );
      toast.success(`Candidate advanced to ${STAGE_LABELS[selectedNextStage as ApplicationStage] || selectedNextStage}!`);
      setIsAdvanceOpen(false);
      setTransitionNotes("");
      loadCandidateData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update candidate stage");
    } finally {
      setIsSubmittingStage(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.id || !rejectReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsSubmittingReject(true);
    try {
      await candidatesApi.rejectApplication(application.id, rejectReason, rejectNotes);
      toast.success("Candidate marked as rejected");
      setIsRejectOpen(false);
      loadCandidateData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject candidate");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold">Candidate profile not found</h2>
        <p className="text-xs text-muted-foreground">The requested candidate record could not be located.</p>
        <Link href="/candidates">
          <Button size="sm" variant="outline" className="text-xs">
            Back to Candidates
          </Button>
        </Link>
      </div>
    );
  }

  const currentStage = (application?.stage as ApplicationStage) || ApplicationStage.NEW;
  const validTransitions = VALID_STAGE_TRANSITIONS[currentStage] || [];
  const skillsList = Array.isArray(candidate.skills)
    ? candidate.skills
    : typeof candidate.skills === "string"
    ? candidate.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Candidate Pipeline
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/messages?candidateId=${candidate.id}`}>
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Send Message
            </Button>
          </Link>

          {application && application.outcome !== "REJECTED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectOpen(true)}
                className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAdvanceOpen(true)}
                disabled={validTransitions.length === 0}
                className="text-xs h-8 gap-1.5 bg-primary font-semibold shadow-sm"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Advance Stage
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-card via-card to-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center border-2 border-background shadow-md shrink-0">
                {candidate.firstName?.[0]}{candidate.lastName?.[0]}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-foreground">
                    {candidate.firstName} {candidate.lastName}
                  </h1>
                  {application && <StatusBadge status={application.stage} />}
                  {application?.outcome && application.outcome !== "NONE" && (
                    <Badge variant={application.outcome === "SELECTED" ? "default" : "destructive"} className="text-xs">
                      {application.outcome}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs font-mono">
                    ID: {candidate.id?.slice(0, 8)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {candidate.currentTitle || "Applicant"} {candidate.currentCompany ? `at ${candidate.currentCompany}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {candidate.city}, {candidate.country || "Bangladesh"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Application Quick Glance */}
            {application && (
              <div className="rounded-xl border bg-card p-4 min-w-[240px] space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Target Requisition:</div>
                <div className="font-bold text-xs text-foreground truncate">
                  {application.requisition?.title || "Direct Application"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Applied on: {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : "N/A"}
                </div>
                <div className="text-[11px] pt-1 border-t text-primary font-medium">
                  Next: {application.nextAction || "Pending review"}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview & Experience</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Stage History & Audit</TabsTrigger>
          <TabsTrigger value="application" className="text-xs">Application Details</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Experience</span>
              <div className="text-xl font-bold text-foreground">
                {candidate.totalExperienceYears ? `${candidate.totalExperienceYears} Years` : "Not specified"}
              </div>
              <div className="text-xs text-muted-foreground">Relevant industry background</div>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Channel</span>
              <div className="text-xl font-bold text-foreground">{candidate.source || "Direct Sourcing"}</div>
              <div className="text-xs text-muted-foreground">Talent acquisition attribution</div>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notice Period</span>
              <div className="text-xl font-bold text-foreground">
                {candidate.noticePeriodDays ? `${candidate.noticePeriodDays} Days` : "Immediate / Negotiable"}
              </div>
              <div className="text-xs text-muted-foreground">Joining availability window</div>
            </Card>
          </div>

          {/* Skills & Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Skills & Core Competencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No specific skill tags entered.</p>
              )}

              {candidate.summary && (
                <div className="pt-2 border-t">
                  <span className="text-xs font-bold text-foreground">Professional Summary</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                    {candidate.summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Timeline & Stage History */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Pipeline Stage Progression & Governance Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Timestamped log of every stage movement with actor notes and reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No previous stage movements recorded yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-6">
                  {history.map((entry, idx) => (
                    <div key={entry.id || idx} className="relative">
                      <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-primary border-4 border-background" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.toStage} />
                          <span className="text-[11px] text-muted-foreground">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Recently"}
                          </span>
                        </div>
                        {entry.fromStage && (
                          <div className="text-xs text-muted-foreground">
                            Transitioned from <span className="font-semibold">{STAGE_LABELS[entry.fromStage as ApplicationStage] || entry.fromStage}</span>
                          </div>
                        )}
                        {entry.reason && (
                          <div className="text-xs font-semibold text-foreground">{entry.reason}</div>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Application Details */}
        <TabsContent value="application" className="space-y-4">
          {application ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Application Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Requisition:</span>
                    <span className="font-semibold text-foreground">{application.requisition?.title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-semibold text-foreground">{application.requisition?.department?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Current Stage:</span>
                    <StatusBadge status={application.stage} />
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Candidate Rating:</span>
                    <span className="font-bold text-amber-500">{application.rating || "Unrated"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Action Item & Due Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Pending Action:</span>
                    <div className="font-semibold text-foreground p-2 rounded bg-muted/30">
                      {application.nextAction || "No pending action assigned"}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Action Due Date:</span>
                    <span className="font-semibold text-foreground">
                      {application.nextActionDueDate ? new Date(application.nextActionDueDate).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No direct application associated.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Advance Stage Dialog */}
      <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advance Candidate Stage</DialogTitle>
            <DialogDescription className="text-xs">
              Transition candidate to the next valid stage in the corporate hiring pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdvanceStage} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Next Stage *</Label>
              <select
                value={selectedNextStage}
                onChange={(e) => setSelectedNextStage(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {validTransitions.map((stg) => (
                  <option key={stg} value={stg}>
                    {STAGE_LABELS[stg as ApplicationStage] || stg}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Transition Note / Feedback</Label>
              <Textarea
                rows={3}
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Details on why candidate is being advanced..."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Next Required Action</Label>
                <Input
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="e.g. Schedule Panel 1"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Action Due Date</Label>
                <Input
                  type="date"
                  value={nextActionDueDate}
                  onChange={(e) => setNextActionDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdvanceOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingStage || !selectedNextStage}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isSubmittingStage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Advance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Reject Candidate
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mark candidate application as rejected with an audit log reason.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Rejection Reason *</Label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select a reason...</option>
                <option value="Skills mismatch">Skills mismatch</option>
                <option value="Salary expectation beyond budget">Salary expectation beyond budget</option>
                <option value="Failed technical assessment">Failed technical assessment</option>
                <option value="Candidate declined offer">Candidate declined offer</option>
                <option value="Poor culture fit">Poor culture fit</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Additional Confidential Notes</Label>
              <Textarea
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Internal feedback..."
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isSubmittingReject || !rejectReason}
                className="text-xs font-semibold gap-1.5"
              >
                {isSubmittingReject && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}