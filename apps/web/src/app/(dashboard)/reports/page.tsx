"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Loader2,
  Users,
  Building,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reportsApi } from "@/lib/api/reports.api";
import { toast } from "sonner";

export default function ReportsAnalyticsPage() {
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [recruiterData, setRecruiterData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const [velocity, source, recruiter, dept] = await Promise.all([
          reportsApi.getPipelineVelocity().catch(() => []),
          reportsApi.getSourceEffectiveness().catch(() => []),
          reportsApi.getRecruiterPerformance().catch(() => []),
          reportsApi.getDepartmentHiring().catch(() => []),
        ]);
        setVelocityData(Array.isArray(velocity) ? velocity : []);
        setSourceData(Array.isArray(source) ? source : []);
        setRecruiterData(Array.isArray(recruiter) ? recruiter : []);
        setDeptData(Array.isArray(dept) ? dept : []);
      } catch (err) {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await reportsApi.exportReport("pipeline-velocity", "xlsx");
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `talentflow-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Executive report downloaded successfully!");
    } catch {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const totalCandidates = sourceData.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalSelected = sourceData.reduce((acc, curr) => acc + (curr.selected || 0), 0);
  const totalJoined = sourceData.reduce((acc, curr) => acc + (curr.joined || 0), 0);
  const avgConversion = totalCandidates > 0 ? ((totalSelected / totalCandidates) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              TA Executive Reports & Metrics
            </h1>
            <Badge variant="purple" className="text-xs">
              Live Database
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Key talent acquisition indicators, hiring velocity, and sourcing funnel yield
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export Executive XLSX Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Sourced
          </span>
          <div className="text-3xl font-black text-foreground">{totalCandidates}</div>
          <div className="text-xs text-muted-foreground">Active candidate database</div>
        </Card>

        <Card className="p-4 space-y-1 border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            Selected / Offers
          </span>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalSelected}</div>
          <div className="text-xs text-emerald-700/80">{avgConversion}% funnel conversion</div>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Confirmed Joined
          </span>
          <div className="text-3xl font-black text-foreground">{totalJoined}</div>
          <div className="text-xs text-muted-foreground">Successfully onboarded</div>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Departments Hiring
          </span>
          <div className="text-3xl font-black text-foreground">{deptData.length}</div>
          <div className="text-xs text-muted-foreground">With active requisitions</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Velocity Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Stage Velocity (Average Days in Stage)
            </CardTitle>
            <CardDescription className="text-xs">
              Average elapsed days candidates spend at each pipeline stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="averageDays" name="Avg Days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sourcing Channel Effectiveness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              Sourcing Channel Yield Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Total applicants vs selections per source channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="total" name="Total Sourced" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selected" name="Selected" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Hiring Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building className="h-4 w-4 text-purple-600" />
            Departmental Requisitions & Headcount Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] border-b">
                <tr>
                  <th className="p-3">Department</th>
                  <th className="p-3">Total Requisitions</th>
                  <th className="p-3">Open Vacancies</th>
                  <th className="p-3">Filled Positions</th>
                  <th className="p-3">Active Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deptData.map((d, i) => (
                  <tr key={d.departmentId || i} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{d.departmentName}</td>
                    <td className="p-3">{d.totalRequisitions}</td>
                    <td className="p-3 font-bold text-primary">{d.openVacancies}</td>
                    <td className="p-3 font-bold text-emerald-600">{d.filledPositions}</td>
                    <td className="p-3">{d.activeApplicants} candidates</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}