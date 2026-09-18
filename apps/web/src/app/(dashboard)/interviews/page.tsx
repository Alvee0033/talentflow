"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronRight,
  Plus,
  Users,
  Search,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { interviewsApi } from "@/lib/api/interviews.api";
import { candidatesApi } from "@/lib/api/candidates.api";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function InterviewsListPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [panelists, setPanelists] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundName, setRoundName] = useState("Technical Assessment");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingType, setMeetingType] = useState("VIRTUAL");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [selectedPanelistIds, setSelectedPanelistIds] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await interviewsApi.getAll({ limit: 100 });
      setInterviews(res?.items || []);
    } catch (err: any) {
      toast.error("Failed to load interview sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openScheduleModal = async () => {
    setIsScheduleOpen(true);
    try {
      const [appsRes, usersRes] = await Promise.all([
        candidatesApi.getApplications({ limit: 50 }).catch(() => ({ items: [] })),
        adminApi.getUsers({ limit: 50 }).catch(() => ({ items: [] })),
      ]);
      const appList = appsRes?.items || [];
      const userList = usersRes?.items || [];
      setApplications(appList);
      setPanelists(userList);
      if (appList.length > 0) setSelectedAppId(appList[0].id);
      if (userList.length > 0) setSelectedPanelistIds([userList[0].id]);
    } catch {
      // ignore
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !startTime || !endTime) {
      toast.error("Please fill in candidate application and interview times");
      return;
    }

    setIsScheduling(true);
    try {
      await interviewsApi.create({
        applicationId: selectedAppId,
        roundNumber: Number(roundNumber) || 1,
        roundName,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        meetingType,
        meetingUrl: meetingUrl || undefined,
        panelistIds: selectedPanelistIds,
      });
      toast.success("Interview scheduled successfully!");
      setIsScheduleOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule interview");
    } finally {
      setIsScheduling(false);
    }
  };

  const filtered = interviews.filter((item) => {
    const candName = item.application?.candidate
      ? `${item.application.candidate.firstName} ${item.application.candidate.lastName}`
      : "";
    const reqTitle = item.application?.requisition?.title || "";
    const matchSearch =
      candName.toLowerCase().includes(search.toLowerCase()) ||
      reqTitle.toLowerCase().includes(search.toLowerCase()) ||
      (item.roundName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Screen 5 Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Interview Scheduling</h1>
          <p className="screen-sub">
            Technical assessments, panel evaluations, and candidate interview schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="role-pill">Role: Recruiter</div>
          <Button
            onClick={openScheduleModal}
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold bg-[#0E7C66] hover:bg-[#0B6452] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-3 shadow-sm border">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate name, round, or requisition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs border rounded-xl bg-card">
          No scheduled interview sessions found matching the filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cand = item.application?.candidate;
            const candName = cand ? `${cand.firstName} ${cand.lastName}` : "Candidate";
            const req = item.application?.requisition;
            const isCompleted = item.status === "COMPLETED";

            return (
              <Card
                key={item.id}
                className="hover:border-primary/40 transition-all shadow-sm overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-foreground">
                        {candName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        Round {item.roundNumber}: {item.roundName}
                      </Badge>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {req?.title || "Requisition"} &bull; {req?.department?.name || "Anwar Group"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {new Date(item.startTime).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(item.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        {item.meetingType === "IN_PERSON" ? (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            {item.location || "Conference Room, HQ"}
                          </>
                        ) : (
                          <>
                            <Video className="h-3.5 w-3.5 text-purple-600" />
                            Virtual Video Panel
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 justify-end">
                    <Link href={`/interviews/${item.id}/evaluate`}>
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className="text-xs h-8 gap-1.5 font-semibold"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        {isCompleted ? "View Scorecard" : "Evaluate"}
                      </Button>
                    </Link>

                    <Link href={`/interviews/${item.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                        Workspace
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Interview Round</DialogTitle>
            <DialogDescription className="text-xs">
              Book a panel session, assign interviewers, and notify the candidate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Candidate Application *</Label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.candidate?.firstName} {app.candidate?.lastName} &mdash; {app.requisition?.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Round Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Round Name *</Label>
                <Input
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="e.g. System Design Panel"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Time *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Time *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="VIRTUAL">Virtual (Video Meeting)</option>
                  <option value="IN_PERSON">In-Person (HQ)</option>
                  <option value="PHONE">Phone Screen</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Meeting URL / Room</Label>
                <Input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assigned Panel Member</Label>
              <select
                value={selectedPanelistIds[0] || ""}
                onChange={(e) => setSelectedPanelistIds([e.target.value])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {panelists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isScheduling}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isScheduling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}