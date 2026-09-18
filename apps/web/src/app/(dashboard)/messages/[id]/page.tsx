"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { messagesApi } from "@/lib/api/messages.api";
import { toast } from "sonner";

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [message, setMessage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMessage = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await messagesApi.getById(id);
      setMessage(res);
    } catch {
      toast.error("Failed to load message details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessage();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await messagesApi.approve(id, "Approved");
      toast.success("Message approved!");
      loadMessage();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    setActionLoading(true);
    try {
      await messagesApi.send(id);
      toast.success("Message sent successfully!");
      loadMessage();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Send failed");
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

  if (!message) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold">Message not found</h2>
        <Link href="/messages">
          <Button size="sm" variant="outline" className="text-xs">
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  const cand = message.candidate;
  const candName = cand ? `${cand.firstName} ${cand.lastName}` : "Candidate";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Messages
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={message.status} />
          {message.status === "AWAITING_APPROVAL" && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={actionLoading}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Approve Message
            </Button>
          )}
          {message.status === "APPROVED" && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={actionLoading}
              className="h-8 text-xs bg-primary font-semibold gap-1"
            >
              <Send className="h-3.5 w-3.5" /> Send Outreach
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">{message.subject || "No Subject"}</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {message.channel}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            To: {candName} ({cand?.email || "No email"}) &bull; Created on{" "}
            {message.createdAt ? new Date(message.createdAt).toLocaleString() : "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-xl border bg-muted/20 whitespace-pre-line leading-relaxed text-foreground">
            {message.body}
          </div>

          {message.approvalNotes && (
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/30 text-purple-900 dark:text-purple-300">
              <span className="font-bold">Approval Audit Note: </span>
              {message.approvalNotes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}