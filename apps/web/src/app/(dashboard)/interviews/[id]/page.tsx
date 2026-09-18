"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  Users,
  AlertCircle,
  FileCheck2,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { interviewsApi } from "@/lib/api/interviews.api";
import { toast } from "sonner";

export default function InterviewWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.id as string;

  const [interview, setInterview] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Cancel state
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const loadData = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      const [intData, evalData] = await Promise.all([
        interviewsApi.getById(interviewId),
        interviewsApi.getEvaluations(interviewId).catch(() => []),
      ]);
      setInterview(intData);
      setEvaluations(evalData || []);
    } catch (err) {
      toast.error("Failed to load interview workspace details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [interviewId]);

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleStart || !rescheduleEnd || !rescheduleReason) {
      toast.error("Please fill in start time, end time, and reschedule reason");
      return;
    }

    setIsSubmittingReschedule(true);
    try {
      await interviewsApi.reschedule(
        interviewId,
        new Date(rescheduleStart).toISOString(),
        new Date(rescheduleEnd).toISOString(),
        rescheduleReason
      );
      toast.success("Interview session rescheduled successfully!");
      setIsRescheduleOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reschedule interview");
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCancel(true);
    try {
      await interviewsApi.cancel(interviewId, cancelReason);
      toast.success("Interview cancelled");
      setIsCancelOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel interview");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await interviewsApi.complete(interviewId);
      toast.success("Interview marked as completed!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark interview as completed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold">Interview session not found</h2>
        <p className="text-xs text-muted-foreground">The requested interview ID does not exist.</p>
        <Link href="/interviews">
          <Button size="sm" variant="outline" className="text-xs">
            Back to Interviews
          </Button>
        </Link>
      </div>
    );
  }

  const cand = interview.application?.candidate;
  const candName = cand ? `${cand.firstName} ${cand.lastName}` : "Candidate";
  const req = interview.application?.requisition;
  const isCompleted = interview.status === "COMPLETED";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/interviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Interviews
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={interview.status} />

          {interview.status !== "CANCELLED" && !isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleOpen(true)}
                className="text-xs h-8"
              >
                Reschedule Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
                className="text-xs h-8 text-destructive hover:text-destructive"
              >
                Cancel Session
              </Button>
              <Button
                size="sm"
                onClick={handleMarkComplete}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Mark Complete
              </Button>
            </>
          )}

          <Link href={`/interviews/${interview.id}/evaluate`}>
            <Button size="sm" className="text-xs h-8 gap-1.5 bg-primary font-semibold">
              <FileCheck2 className="h-3.5 w-3.5" />
              {isCompleted ? "View Scorecard" : "Submit Blind Evaluation"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Banner */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-card via-card to-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">
                  Round {interview.roundNumber}: {interview.roundName}
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  {interview.meetingType || "VIRTUAL"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Candidate: <strong className="text-foreground">{candName}</strong> &bull; Requisition:{" "}
                <strong className="text-foreground">{req?.title || "Role"}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {new Date(interview.startTime).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {new Date(interview.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(interview.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {interview.meetingUrl && (
              <div className="rounded-xl border bg-card p-4 space-y-2 min-w-[220px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meeting Link</span>
                <div>
                  <a
                    href={interview.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Join Video Conference
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Candidate Context & Panel Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Candidate Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-semibold text-foreground">{candName}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-semibold text-foreground">{cand?.email || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Current Title:</span>
              <span className="font-semibold text-foreground">{cand?.currentTitle || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Experience:</span>
              <span className="font-semibold text-foreground">
                {cand?.totalExperienceYears ? `${cand.totalExperienceYears} Years` : "N/A"}
              </span>
            </div>
            <div className="pt-2">
              <Link href={`/candidates/${interview.application?.candidateId || interview.applicationId}`}>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Open Candidate Full Workspace &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-purple-600" />
              Panel Members & Blind Evaluations
            </CardTitle>
            <CardDescription className="text-xs">
              Evaluations remain confidential until all panel members have submitted their scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {interview.panelists && interview.panelists.length > 0 ? (
              <div className="space-y-2">
                {interview.panelists.map((panelist: any) => (
                  <div key={panelist.id} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">
                        {panelist.firstName} {panelist.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{panelist.email}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Panelist
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No panel members assigned.</p>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Submitted Evaluations:</span>
                <span className="font-bold text-foreground">{evaluations.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Evaluations List */}
      {evaluations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Submitted Panel Scorecards ({evaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluations.map((ev, i) => (
              <div key={ev.id || i} className="p-4 rounded-xl border bg-card space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">
                    Evaluator: {ev.evaluator ? `${ev.evaluator.firstName} ${ev.evaluator.lastName}` : `Panel Member ${i + 1}`}
                  </span>
                  <Badge variant={ev.recommendation === "STRONGLY_RECOMMEND" || ev.recommendation === "RECOMMEND" ? "default" : "destructive"}>
                    {ev.recommendation}
                  </Badge>
                </div>
                {ev.strengths && (
                  <div>
                    <span className="font-semibold text-emerald-700">Strengths: </span>
                    <span className="text-muted-foreground">{ev.strengths}</span>
                  </div>
                )}
                {ev.weaknesses && (
                  <div>
                    <span className="font-semibold text-amber-700">Areas for Growth: </span>
                    <span className="text-muted-foreground">{ev.weaknesses}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription className="text-xs">
              Propose new session timing and notify candidate and panel members.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">New Start Time *</Label>
              <Input
                type="datetime-local"
                required
                value={rescheduleStart}
                onChange={(e) => setRescheduleStart(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New End Time *</Label>
              <Input
                type="datetime-local"
                required
                value={rescheduleEnd}
                onChange={(e) => setRescheduleEnd(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reschedule Reason *</Label>
              <Textarea
                rows={3}
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Reason for changing interview time..."
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingReschedule}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isSubmittingReschedule && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Interview</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to cancel this interview session?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Cancellation Reason</Label>
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Provide reason..."
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCancelOpen(false)}
                className="text-xs"
              >
                Back
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isSubmittingCancel}
                className="text-xs font-semibold gap-1.5"
              >
                {isSubmittingCancel && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}