"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export function RecruiterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getRecruiterDashboard()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to load recruiter dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7C66]" />
      </div>
    );
  }

  const pipelineArray = data?.pipelineByStage
    ? Object.entries(data.pipelineByStage).map(([stage, count]) => ({
        stage: stage.replace("_", " "),
        count,
      }))
    : [];

  const tasksList = data?.pendingTasks && data.pendingTasks.length > 0
    ? data.pendingTasks
    : [
        {
          id: "1",
          candidateName: "Farhan Ahmed",
          position: "Backend Engineer",
          stage: "INTERVIEW",
          nextAction: "Send eval reminder",
          owner: "Recruiter",
          due: "Today",
          isOverdue: false,
        },
        {
          id: "2",
          candidateName: "Sadia Islam",
          position: "QA Analyst",
          stage: "FEEDBACK_PENDING",
          nextAction: "Consolidate scores",
          owner: "Recruiter",
          due: "Tomorrow",
          isOverdue: false,
        },
        {
          id: "3",
          candidateName: "Tanvir Rahman",
          position: "Product Designer",
          stage: "APPROVAL",
          nextAction: "Awaiting HM sign-off",
          owner: "Hiring Mgr",
          due: "Overdue",
          isOverdue: true,
        },
      ];

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "INTERVIEW":
        return <span className="badge badge-teal">Interview</span>;
      case "FEEDBACK_PENDING":
        return <span className="badge badge-blue">Feedback Pending</span>;
      case "APPROVAL":
        return <span className="badge badge-grey">Approval</span>;
      case "SCREENING":
        return <span className="badge badge-grey">Screening</span>;
      default:
        return <span className="badge badge-teal">{stage}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Recruiter Dashboard</h1>
          <p className="screen-sub">Your active work, at a glance</p>
        </div>
        <div className="role-pill">Role: Recruiter</div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="flex gap-3.5 mb-5 flex-wrap">
        <div className="kpi">
          <div className="num text-[#1B2130]">{data?.activeRequisitionsCount ?? 6}</div>
          <div className="label">Active Requisitions</div>
        </div>
        <div className="kpi">
          <div className="num text-[#0E7C66]">{data?.upcomingInterviews?.length ?? 3}</div>
          <div className="label">Interviews Today</div>
        </div>
        <div className="kpi">
          <div className="num text-[#26568F]">{data?.messagesAwaitingApproval ?? 2}</div>
          <div className="label">Messages Awaiting Approval</div>
        </div>
        <div className="kpi">
          <div className="num text-[#A23B34]">{data?.feedbackOverdue ?? 1}</div>
          <div className="label">Feedback Overdue</div>
        </div>
      </div>

      {/* 3. My Tasks Panel */}
      <div className="panel">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-[#1B2130]">My Tasks — next action, owner, due date</h3>
          <Link href="/tasks" className="text-xs font-semibold text-[#0E7C66] hover:underline">
            View All Tasks →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E2E5EA]">
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Candidate</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Position</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Stage</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Next Action</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Owner</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasksList.map((t: any, idx: number) => {
                const candName = t.candidateName || t.title?.split("for ")?.[1] || "Farhan Ahmed";
                const position = t.position || "Backend Engineer";
                const stage = t.stage || "INTERVIEW";
                const nextAct = t.nextAction || t.title || "Review application";
                const owner = t.owner || "Recruiter";
                const dueText = t.due || (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Today");
                const isOver = t.isOverdue || t.priority === "URGENT";

                return (
                  <tr key={t.id || idx} className="border-b border-[#E2E5EA] last:border-b-0 hover:bg-[#FAFBFC]">
                    <td className="py-3 px-2.5 font-semibold text-[#1B2130]">{candName}</td>
                    <td className="py-3 px-2.5 text-[#5B6577]">{position}</td>
                    <td className="py-3 px-2.5">{getStageBadge(stage)}</td>
                    <td className="py-3 px-2.5 text-[#1B2130]">{nextAct}</td>
                    <td className="py-3 px-2.5 text-[#5B6577]">{owner}</td>
                    <td className="py-3 px-2.5">
                      {isOver ? (
                        <span className="badge badge-red">Overdue</span>
                      ) : (
                        <span className="text-[#5B6577] font-medium">{dueText}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Grid-2: Interviews Today & Joining Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="panel">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1B2130] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0E7C66]" />
              Interviews Today
            </h3>
            <Link href="/interviews" className="text-xs font-semibold text-[#0E7C66] hover:underline">
              Manage →
            </Link>
          </div>
          <p className="text-[13px] text-[#5B6577] mb-3">
            {data?.upcomingInterviews?.length ? `${data.upcomingInterviews.length} scheduled today` : "3 scheduled — 10:00 AM, 1:30 PM, 4:00 PM"}
          </p>
          <div className="space-y-2">
            {(data?.upcomingInterviews?.length ? data.upcomingInterviews : [
              { id: "i1", title: "Farhan Ahmed — Round 1 Technical", time: "10:00 AM (Google Meet)", status: "CONFIRMED" },
              { id: "i2", title: "Sadia Islam — Technical Assessment", time: "1:30 PM (Meeting Room B)", status: "SCHEDULED" },
              { id: "i3", title: "Tanvir Rahman — Portfolio Review", time: "4:00 PM (Google Meet)", status: "CONFIRMED" },
            ]).map((int: any) => (
              <div key={int.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E5EA] bg-[#FAFBFC]">
                <div>
                  <div className="text-xs font-semibold text-[#1B2130]">{int.title}</div>
                  <div className="text-[11px] text-[#5B6577]">{int.time || new Date(int.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span className="badge badge-teal text-[10px]">{int.status || "CONFIRMED"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#1B2130] flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#26568F]" />
              Joining Actions
            </h3>
            <Link href="/joining" className="text-xs font-semibold text-[#0E7C66] hover:underline">
              Checklist Hub →
            </Link>
          </div>
          <p className="text-[13px] text-[#5B6577] mb-3">
            2 candidates in checklist stage this week
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E5EA] bg-[#FAFBFC]">
              <div>
                <div className="text-xs font-semibold text-[#1B2130]">Kazi Arifur Rahman</div>
                <div className="text-[11px] text-[#5B6577]">Plant Metallurgist · Joining: 20 Sep</div>
              </div>
              <span className="badge badge-teal text-[10px]">8/13 Done</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E5EA] bg-[#FAFBFC]">
              <div>
                <div className="text-xs font-semibold text-[#1B2130]">Farhan Chowdhury</div>
                <div className="text-[11px] text-[#5B6577]">Backend Engineer · Joining: 28 Sep</div>
              </div>
              <span className="badge badge-amber text-[10px]">Pending IT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Pipeline Funnel Chart */}
      {pipelineArray.length > 0 && (
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-1">Candidate Pipeline by Stage</h3>
          <p className="text-[12px] text-[#5B6577] mb-4">Live candidate distribution across your assigned requisitions</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineArray}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#5B6577" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5B6577" }} />
                <Tooltip contentStyle={{ background: "#233247", color: "#fff", borderRadius: "8px", border: "none", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#0E7C66" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

