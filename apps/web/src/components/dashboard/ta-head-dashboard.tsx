"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Loader2,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export function TAHeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getTAHeadDashboard()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to load TA head dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pipelineArray = data?.pipelineFunnel
    ? Object.entries(data.pipelineFunnel).map(([stage, count]) => ({
        stage: stage.replace("_", " "),
        count,
      }))
    : [];

  return (
    <div className="space-y-5">
      {/* Screen 9 Topline Header */}
      <div className="topline">
        <div>
          <h1 className="screen-title">Management Dashboard</h1>
          <p className="screen-sub">Recruitment health across all business units</p>
        </div>
        <div className="role-pill">Role: TA Head</div>
      </div>

      {/* Screen 9 KPI Row */}
      <div className="flex gap-3.5 mb-5 flex-wrap">
        <div className="kpi">
          <div className="num text-[#1B2130]">{data?.overview?.openRequisitions ?? 14}</div>
          <div className="label">Open Requisitions</div>
        </div>
        <div className="kpi">
          <div className="num text-[#0E7C66]">{data?.overview?.pendingApprovals ?? 5}</div>
          <div className="label">Pending Approvals</div>
        </div>
        <div className="kpi">
          <div className="num text-[#26568F]">{data?.overview?.upcomingJoining ?? 3}</div>
          <div className="label">Upcoming Joining (7d)</div>
        </div>
        <div className="kpi">
          <div className="num text-[#A23B34]">{data?.overview?.highRiskVacancies ?? 2}</div>
          <div className="label">High-Risk Vacancies</div>
        </div>
      </div>

      {/* Screen 9 Grid-2: Recruiter Workload & Candidates by Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        {/* Recruiter Workload */}
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-4">Recruiter Workload</h3>
          <div className="space-y-3.5">
            {[
              { name: "R. Ahmed", percent: 88, activeCount: "14 candidates" },
              { name: "S. Karim", percent: 64, activeCount: "10 candidates" },
              { name: "N. Haque", percent: 75, activeCount: "12 candidates" },
              { name: "T. Rahman", percent: 35, activeCount: "5 candidates" },
            ].map((rec) => (
              <div key={rec.name} className="flex items-center gap-2.5 text-xs">
                <span className="w-20 text-[#5B6577] font-semibold">{rec.name}</span>
                <div className="flex-1 bg-[#EDEFF3] h-4 rounded-md overflow-hidden">
                  <div
                    className="bg-[#8AA0C4] h-full rounded-md transition-all"
                    style={{ width: `${rec.percent}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-[#5B6577] w-24 text-right">{rec.activeCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Candidates by Stage */}
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-4">Candidates by Stage</h3>
          <div className="flex items-end gap-2.5 h-40 pt-2 pb-1">
            {[
              { label: "New", height: "90%", count: 18 },
              { label: "Screen", height: "70%", count: 14 },
              { label: "Assess", height: "55%", count: 11 },
              { label: "Interview", height: "82%", count: 16 },
              { label: "Feedback", height: "35%", count: 7 },
              { label: "Approval", height: "22%", count: 4 },
            ].map((st) => (
              <div key={st.label} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] font-bold text-[#1B2130] mb-1">{st.count}</span>
                <div
                  className="w-full bg-[#0E7C66] rounded-t transition-all hover:bg-[#0B6452]"
                  style={{ height: st.height }}
                ></div>
                <span className="text-[10.5px] text-[#5B6577] font-medium mt-1.5">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen 9 Stage Ageing & High-Risk Vacancies */}
      <div className="panel">
        <h3 className="text-sm font-bold text-[#1B2130] mb-3">Stage Ageing &amp; High-Risk Vacancies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E2E5EA]">
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Position</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Detail</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Risk</th>
                <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E2E5EA] hover:bg-[#FAFBFC]">
                <td className="py-3 px-2.5 font-semibold text-[#1B2130]">Senior Data Engineer</td>
                <td className="py-3 px-2.5 text-[#5B6577]">28 days in Screening (Threshold: 14d)</td>
                <td className="py-3 px-2.5">
                  <span className="badge badge-red">High</span>
                </td>
                <td className="py-3 px-2.5">
                  <Link href="/candidates" className="text-xs font-semibold text-[#0E7C66] hover:underline">
                    Reallocate Recruiter →
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-[#E2E5EA] last:border-b-0 hover:bg-[#FAFBFC]">
                <td className="py-3 px-2.5 font-semibold text-[#1B2130]">UX Researcher</td>
                <td className="py-3 px-2.5 text-[#5B6577]">21 days in Feedback Pending (Threshold: 7d)</td>
                <td className="py-3 px-2.5">
                  <span className="badge badge-amber">Medium</span>
                </td>
                <td className="py-3 px-2.5">
                  <Link href="/interviews" className="text-xs font-semibold text-[#0E7C66] hover:underline">
                    Nudge Panelists →
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
