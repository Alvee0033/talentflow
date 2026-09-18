"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Check,
  X,
  Smartphone,
  ChevronRight,
  Filter,
  Loader2,
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
import { messagesApi } from "@/lib/api/messages.api";
import { candidatesApi } from "@/lib/api/candidates.api";
import { toast } from "sonner";

export default function CommunicationsHubPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSendingDraft, setIsSendingDraft] = useState(false);

  // Selected Message Modal State
  const [viewingMessage, setViewingMessage] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Modal State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [msgRes, tplRes, candRes] = await Promise.all([
        messagesApi.getAll({ limit: 100 }),
        messagesApi.getTemplates().catch(() => []),
        candidatesApi.getAll({ limit: 50 }).catch(() => ({ items: [] })),
      ]);
      const fetchedMsgs = msgRes?.items || [];
      setMessages(fetchedMsgs);
      setTemplates(tplRes || []);
      const candItems = candRes?.items || [];
      setCandidates(candItems);
      if (candItems.length > 0) setSelectedCandidateId(candItems[0].id);

      setSelectedMessageId((prev) => {
        if (prev && fetchedMsgs.some((m: any) => m.id === prev)) return prev;
        const awaiting = fetchedMsgs.find((m: any) => m.status === "AWAITING_APPROVAL");
        return awaiting ? awaiting.id : fetchedMsgs[0]?.id || null;
      });
    } catch (err: any) {
      toast.error("Failed to load communications data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setSubject(tpl.subject || "");
      setBody(tpl.body || "");
      setChannel(tpl.channel || "EMAIL");
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId || !body) {
      toast.error("Please select a candidate and enter message content");
      return;
    }

    setIsSendingDraft(true);
    try {
      const draft = await messagesApi.createDraft({
        candidateId: selectedCandidateId,
        templateId: selectedTemplateId || undefined,
        channel,
        subject: subject || "Update from Anwar Group Talent Acquisition",
        body,
      });
      toast.success("Message drafted successfully!");
      setIsComposeOpen(false);
      setSubject("");
      setBody("");
      if (draft?.id) {
        setSelectedMessageId(draft.id);
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create message draft");
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleRequestApproval = async (msgId: string) => {
    setActionLoading(true);
    try {
      await messagesApi.requestApproval(msgId);
      toast.success("Message submitted for approval!");
      setSelectedMessageId(msgId);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit for approval");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAndSend = async (msgId: string) => {
    setActionLoading(true);
    try {
      await messagesApi.approve(msgId, "Approved by TA Lead");
      await messagesApi.send(msgId);
      toast.success("Message approved and dispatched via delivery gateway!");
      setSelectedMessageId(msgId);
      if (viewingMessage?.id === msgId) {
        setViewingMessage((prev: any) => ({ ...prev, status: "SENT" }));
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve and send message");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTargetId) return;
    setActionLoading(true);
    try {
      await messagesApi.reject(rejectTargetId, rejectReason || "Revisions requested");
      toast.success("Message returned to draft for revision / editing");
      setSelectedMessageId(rejectTargetId);
      setIsRejectOpen(false);
      setRejectTargetId(null);
      setRejectReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async (msgId: string) => {
    setActionLoading(true);
    try {
      await messagesApi.send(msgId);
      toast.success("Message dispatched via delivery gateway!");
      setSelectedMessageId(msgId);
      if (viewingMessage?.id === msgId) {
        setViewingMessage((prev: any) => ({ ...prev, status: "SENT" }));
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Dispatch failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "AWAITING_APPROVAL") return m.status === "AWAITING_APPROVAL";
    if (activeTab === "SENT") return m.status === "SENT" || m.status === "DELIVERED";
    if (activeTab === "DRAFT") return m.status === "DRAFTED";
    return true;
  });

  // Active message in approval spotlight
  const spotlightMessage =
    (selectedMessageId ? messages.find((m) => m.id === selectedMessageId) : null) ||
    messages.find((m) => m.status === "AWAITING_APPROVAL") ||
    messages[0] ||
    null;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Screen 7 Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Message Approval Queue</h1>
          <p className="screen-sub" data-testid="spotlight-sub">
            {spotlightMessage?.subject || "Interview invitation"} ·{" "}
            {spotlightMessage?.candidate?.firstName
              ? `${spotlightMessage.candidate.firstName} ${spotlightMessage.candidate.lastName}`
              : "Farhan Ahmed"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="role-pill">Role: Recruiter</div>
          <Button
            onClick={() => setIsComposeOpen(true)}
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold bg-[#0E7C66] hover:bg-[#0B6452] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Compose Message
          </Button>
        </div>
      </div>

      {/* Screen 7 Pipeline Stepper */}
      <div className="pipeline-track" data-testid="pipeline-track">
        <div
          data-testid="pipeline-step-drafted"
          onClick={() => {
            const m = messages.find((x) => x.status === "DRAFTED");
            if (m) setSelectedMessageId(m.id);
          }}
          className={`pipeline-step cursor-pointer ${
            spotlightMessage?.status === "DRAFTED"
              ? "active"
              : spotlightMessage?.status === "AWAITING_APPROVAL" ||
                spotlightMessage?.status === "APPROVED" ||
                spotlightMessage?.status === "SENT" ||
                spotlightMessage?.status === "DELIVERED"
              ? "completed"
              : ""
          }`}
        >
          Drafted
        </div>
        <div
          data-testid="pipeline-step-awaiting"
          onClick={() => {
            const m = messages.find((x) => x.status === "AWAITING_APPROVAL");
            if (m) setSelectedMessageId(m.id);
          }}
          className={`pipeline-step cursor-pointer ${
            spotlightMessage?.status === "AWAITING_APPROVAL"
              ? "active"
              : spotlightMessage?.status === "APPROVED" ||
                spotlightMessage?.status === "SENT" ||
                spotlightMessage?.status === "DELIVERED"
              ? "completed"
              : ""
          }`}
        >
          Awaiting Approval
        </div>
        <div
          data-testid="pipeline-step-approved"
          onClick={() => {
            const m = messages.find((x) => x.status === "APPROVED");
            if (m) setSelectedMessageId(m.id);
          }}
          className={`pipeline-step cursor-pointer ${
            spotlightMessage?.status === "APPROVED"
              ? "active"
              : spotlightMessage?.status === "SENT" ||
                spotlightMessage?.status === "DELIVERED"
              ? "completed"
              : ""
          }`}
        >
          Approved
        </div>
        <div
          data-testid="pipeline-step-sent"
          onClick={() => {
            const m = messages.find((x) => x.status === "SENT" || x.status === "DELIVERED");
            if (m) setSelectedMessageId(m.id);
          }}
          className={`pipeline-step cursor-pointer ${
            spotlightMessage?.status === "SENT" || spotlightMessage?.status === "DELIVERED"
              ? "active"
              : ""
          }`}
        >
          Sent
        </div>
      </div>

      {/* Screen 7 Spotlight: Draft Preview & Approval Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130]">Draft Preview</h3>
          <p className="text-xs text-[#5B6577] mb-3">
            To:{" "}
            <strong className="text-[#1B2130]">
              {spotlightMessage?.candidate?.firstName
                ? `${spotlightMessage.candidate.firstName} ${spotlightMessage.candidate.lastName}`
                : "Farhan Ahmed"}
            </strong>{" "}
            &nbsp;·&nbsp; Channel:{" "}
            <span className="badge badge-blue">
              {spotlightMessage?.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
            </span>
          </p>
          <div className="p-4 border border-[#E2E5EA] rounded-lg bg-white min-h-[160px] text-xs space-y-2">
            <div className="font-bold text-[#1B2130] pb-2 border-b border-[#E2E5EA]">
              Subject: {spotlightMessage?.subject || "Interview Invitation — Round 1 Technical"}
            </div>
            <p className="text-[#1B2130] whitespace-pre-wrap leading-relaxed">
              {spotlightMessage?.body ||
                "Dear Farhan,\n\nYou have been shortlisted for the Round 1 Technical Assessment for Backend Engineer at Anwar Group.\n\nDate: Friday, 3:00 PM\nFormat: Google Meet\n\nPlease confirm your availability."}
            </p>
          </div>
        </div>

        <div>
          <div className="panel">
            <h3 className="text-sm font-bold text-[#1B2130]">Approval Actions</h3>
            {spotlightMessage?.status === "AWAITING_APPROVAL" ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleApproveAndSend(spotlightMessage.id)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  data-testid="approve-send-btn"
                >
                  {actionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Approve &amp; Send
                </button>
                <button
                  onClick={() => {
                    setRejectTargetId(spotlightMessage.id);
                    setIsRejectOpen(true);
                  }}
                  disabled={actionLoading}
                  className="btn btn-outline"
                  data-testid="reject-edit-btn"
                >
                  Reject / Edit
                </button>
              </div>
            ) : spotlightMessage?.status === "DRAFTED" ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleRequestApproval(spotlightMessage.id)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  data-testid="request-approval-btn"
                >
                  {actionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Submit for Approval
                </button>
                <button
                  onClick={() => setViewingMessage(spotlightMessage)}
                  disabled={actionLoading}
                  className="btn btn-outline"
                >
                  View Details
                </button>
              </div>
            ) : spotlightMessage?.status === "APPROVED" ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleSend(spotlightMessage.id)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  data-testid="send-now-btn"
                >
                  {actionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Dispatch to Candidate
                </button>
              </div>
            ) : spotlightMessage?.status === "SENT" ||
              spotlightMessage?.status === "DELIVERED" ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">
                  Message successfully approved and delivered to candidate.
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#5B6577]">
                Status: {spotlightMessage?.status || "DRAFTED"}
              </p>
            )}
            <p className="text-[11.5px] text-[#5B6577] mt-3">
              Internal notes and rejection reasons never appear in candidate-facing text.
            </p>
          </div>

          <div className="panel">
            <h3 className="text-sm font-bold text-[#1B2130]">Delivery Status</h3>
            <p className="text-xs text-[#5B6577]" data-testid="delivery-status-text">
              {spotlightMessage?.status === "SENT" ||
              spotlightMessage?.status === "DELIVERED"
                ? "Dispatched and delivered via secure corporate gateway."
                : spotlightMessage?.status === "APPROVED"
                ? "Approved by TA Head — ready to dispatch."
                : spotlightMessage?.status === "AWAITING_APPROVAL"
                ? "Not yet sent — awaiting approval."
                : "Draft message created — pending review submission."}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="ALL" className="text-xs">
              All ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="AWAITING_APPROVAL" className="text-xs text-amber-600">
              Needs Approval
            </TabsTrigger>
            <TabsTrigger value="SENT" className="text-xs text-emerald-600">
              Dispatched &amp; Sent
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className="text-xs">
              Drafts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs border rounded-xl bg-card">
          No communication records found for this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const candName = msg.candidate
              ? `${msg.candidate.firstName} ${msg.candidate.lastName}`
              : "Candidate";
            const isAwaiting = msg.status === "AWAITING_APPROVAL";
            const isApproved = msg.status === "APPROVED";
            const isSelected = selectedMessageId
              ? selectedMessageId === msg.id
              : spotlightMessage?.id === msg.id;

            return (
              <Card
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`transition-all shadow-sm overflow-hidden cursor-pointer hover:border-primary/50 ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/25 bg-emerald-50/10"
                    : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{candName}</span>
                      <StatusBadge status={msg.status} />
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {msg.channel === "WHATSAPP" ? (
                          <>
                            <Smartphone className="h-3 w-3 text-emerald-600" /> WhatsApp
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3 text-blue-600" /> Email
                          </>
                        )}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-foreground">
                      {msg.subject || "Message Notification"}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {msg.body}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 justify-end">
                    {isAwaiting && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectTargetId(msg.id);
                            setIsRejectOpen(true);
                          }}
                          disabled={actionLoading}
                          className="h-8 text-xs text-destructive hover:text-destructive"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveAndSend(msg.id);
                          }}
                          disabled={actionLoading}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          Approve &amp; Send
                        </Button>
                      </>
                    )}

                    {isApproved && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSend(msg.id);
                        }}
                        disabled={actionLoading}
                        className="h-8 text-xs bg-primary font-semibold gap-1"
                      >
                        <Send className="h-3.5 w-3.5" /> Send Now
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingMessage(msg);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Compose Outreach Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Compose Candidate Outreach</DialogTitle>
            <DialogDescription className="text-xs">
              Draft formal candidate communication through verified corporate templates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDraft} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Recipient Candidate *</Label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Channel</Label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Use Standard Template</Label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">Custom Outreach</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject Line *</Label>
              <Input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Interview Invitation: Technical Round with Anwar Group"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Message Body *</Label>
              <Textarea
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose message body..."
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsComposeOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSendingDraft || !body}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isSendingDraft && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Message Detail Dialog */}
      {viewingMessage && (
        <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base">Message Overview</DialogTitle>
                <StatusBadge status={viewingMessage.status} />
              </div>
              <DialogDescription className="text-xs">
                To: {viewingMessage.candidate?.firstName} {viewingMessage.candidate?.lastName} (
                {viewingMessage.candidate?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1 border">
                <span className="font-bold text-foreground">Subject: </span>
                <span className="text-muted-foreground">{viewingMessage.subject}</span>
              </div>
              <div className="p-4 rounded-lg bg-card border whitespace-pre-line leading-relaxed text-muted-foreground">
                {viewingMessage.body}
              </div>
            </div>
            <DialogFooter className="gap-2">
              {viewingMessage.status === "AWAITING_APPROVAL" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const id = viewingMessage.id;
                      setViewingMessage(null);
                      setRejectTargetId(id);
                      setIsRejectOpen(true);
                    }}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Reject / Request Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveAndSend(viewingMessage.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Approve &amp; Send
                  </Button>
                </>
              )}
              {viewingMessage.status === "APPROVED" && (
                <Button
                  size="sm"
                  onClick={() => handleSend(viewingMessage.id)}
                  className="text-xs bg-primary font-semibold gap-1"
                >
                  <Send className="h-3.5 w-3.5" /> Send Now
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingMessage(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject / Edit Reason Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return for Revision / Edit</DialogTitle>
            <DialogDescription className="text-xs">
              Provide feedback or instructions for why this communication needs editing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs py-2">
            <Label className="text-xs font-semibold">Revision Notes / Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please update the interview time to 4:00 PM and attach candidate instructions."
              rows={3}
              className="text-xs"
              data-testid="reject-reason-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRejectOpen(false);
                setRejectTargetId(null);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={confirmReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
              data-testid="confirm-reject-btn"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Return for Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}