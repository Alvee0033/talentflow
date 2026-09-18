import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  if (label) {
    return <Badge variant="secondary" className={className}>{label}</Badge>;
  }
  const normalized = status.toUpperCase().replace(/\s+/g, "_");

  switch (normalized) {
    // Pipeline Stages
    case "NEW":
      return <Badge variant="info" className={className}>New Application</Badge>;
    case "SCREENING":
      return <Badge variant="purple" className={className}>Screening</Badge>;
    case "ASSESSMENT":
      return <Badge variant="warning" className={className}>Assessment</Badge>;
    case "INTERVIEW":
      return <Badge variant="default" className={className}>Interview</Badge>;
    case "FEEDBACK_PENDING":
      return <Badge variant="warning" className={className}>Feedback Pending</Badge>;
    case "APPROVAL":
      return <Badge variant="purple" className={className}>Offer Approval</Badge>;
    case "SELECTED":
      return <Badge variant="success" className={className}>Selected / Offer</Badge>;
    case "JOINING":
      return <Badge variant="info" className={className}>Joining Checklist</Badge>;
    case "JOINED":
      return <Badge variant="success" className={className}>Joined</Badge>;

    // Requisition Statuses
    case "OPEN":
      return <Badge variant="success" className={className}>Open</Badge>;
    case "APPROVED":
      return <Badge variant="info" className={className}>Approved</Badge>;
    case "PENDING_APPROVAL":
      return <Badge variant="warning" className={className}>Pending Approval</Badge>;
    case "DRAFT":
      return <Badge variant="secondary" className={className}>Draft</Badge>;
    case "ON_HOLD":
      return <Badge variant="warning" className={className}>On Hold</Badge>;
    case "FILLED":
      return <Badge variant="success" className={className}>Filled</Badge>;
    case "CLOSED":
      return <Badge variant="secondary" className={className}>Closed</Badge>;

    // Priorities
    case "URGENT":
      return <Badge variant="destructive" className={className}>Urgent</Badge>;
    case "HIGH":
      return <Badge variant="warning" className={className}>High</Badge>;
    case "MEDIUM":
      return <Badge variant="info" className={className}>Medium</Badge>;
    case "LOW":
      return <Badge variant="secondary" className={className}>Low</Badge>;

    // Message Statuses
    case "AWAITING_APPROVAL":
      return <Badge variant="warning" className={className}>Awaiting Approval</Badge>;
    case "SENT":
      return <Badge variant="success" className={className}>Sent</Badge>;
    case "FAILED":
      return <Badge variant="destructive" className={className}>Failed</Badge>;
    case "SCHEDULED":
      return <Badge variant="info" className={className}>Scheduled</Badge>;

    // Checklist item statuses
    case "COMPLETED":
      return <Badge variant="success" className={className}>Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="warning" className={className}>In Progress</Badge>;
    case "PENDING":
      return <Badge variant="secondary" className={className}>Pending</Badge>;
    case "WAIVED":
      return <Badge variant="outline" className={className}>Waived</Badge>;

    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}