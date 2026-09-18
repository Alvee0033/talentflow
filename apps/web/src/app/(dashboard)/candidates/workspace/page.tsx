"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  MessageSquare,
  History,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  Download,
  Send,
  Plus,
} from "lucide-react";
import { candidatesApi } from "@/lib/api/candidates.api";
import { interviewsApi } from "@/lib/api/interviews.api";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export default function CandidateWorkspaceHubPage() {
  const { user } = useAuth();
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Profile" | "Documents" | "Assessment" | "Interviews" | "Messages" | "History">("Interviews");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const appsRes = await candidatesApi.getApplications({ limit: 20 });
        const items = appsRes.items || [];
        setCandidatesList(items);

        // Find candidate matching Farhan Ahmed or first application
        const farhan = items.find((a: any) =>
          a.candidate?.firstName?.toLowerCase().includes("farhan") ||
          a.candidate?.lastName?.toLowerCase().includes("ahmed")
        );
        const target = farhan || items[0] || null;
        setSelectedApp(target);

        if (target) {
          const ints = await interviewsApi.getAll({ applicationId: target.id }).catch(() => ({ items: [] }));
          setInterviews(ints.items || []);
        }
      } catch (err) {
        console.error("Failed to load candidate workspace", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceData();
  }, []);

  const handleSelectApp = async (app: any) => {
    setSelectedApp(app);
    try {
      const ints = await interviewsApi.getAll({ applicationId: app.id }).catch(() => ({ items: [] }));
      setInterviews(ints.items || []);
    } catch {
      setInterviews([]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7C66]" />
      </div>
    );
  }

  const cand = selectedApp?.candidate || {
    firstName: "Farhan",
    lastName: "Ahmed",
    email: "farhan.ahmed@example.com",
    phone: "+880 1711 000111",
    source: "Referral",
  };
  const position = selectedApp?.requisition?.title || "Backend Engineer";
  const stage = selectedApp?.stage || "INTERVIEW";
  const source = cand?.source || "Referral";

  return (
    <div className="space-y-5">
      {/* 1. Topline Header */}
      <div className="topline">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="screen-title">{cand.firstName} {cand.lastName}</h1>
            {candidatesList.length > 1 && (
              <select
                className="text-xs border border-[#E2E5EA] rounded px-2 py-1 bg-white font-medium text-[#5B6577]"
                value={selectedApp?.id || ""}
                onChange={(e) => {
                  const found = candidatesList.find((a) => a.id === e.target.value);
                  if (found) handleSelectApp(found);
                }}
              >
                {candidatesList.map((a) => (
                  <option key={a.id} value={a.id}>
                    Switch: {a.candidate?.firstName} {a.candidate?.lastName} ({a.requisition?.title || "Role"})
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="screen-sub">
            Applying for {position} · Source: {source}
          </p>
        </div>
        <div className="role-pill">
          Stage: {stage.replace("_", " ")}
        </div>
      </div>

      {/* 2. Accountability & Coordination Banner */}
      <div className="panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4.5">
        <div className="text-[13px] text-[#5B6577]">
          Recruiter: <strong className="text-[#1B2130] font-semibold">R. Ahmed</strong> &nbsp;·&nbsp;
          Next: <strong className="text-[#1B2130] font-semibold">{selectedApp?.nextAction || "Panel evaluation"}</strong> &nbsp;·&nbsp;
          Due: <strong className="text-[#1B2130] font-semibold">Friday, 5:00 PM</strong>
        </div>
        <span className="badge badge-teal">On track</span>
      </div>

      {/* 3. 6 Navigation Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(["Profile", "Documents", "Assessment", "Interviews", "Messages", "History"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 text-[12.5px] font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? "bg-[#233247] text-white shadow-sm"
                : "bg-[#EDEFF3] text-[#5B6577] hover:bg-[#E2E5EA] hover:text-[#1B2130]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Active Tab Content */}
      {activeTab === "Interviews" && (
        <div className="panel">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-[#1B2130]">Interview Rounds</h3>
            <Link href="/interviews" className="text-xs font-semibold text-[#0E7C66] hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Schedule Round
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#E2E5EA]">
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Round</th>
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Type</th>
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Date</th>
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Panel</th>
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Form</th>
                  <th className="pb-2.5 px-2.5 text-[11px] font-semibold text-[#5B6577]">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E5EA] hover:bg-[#FAFBFC]">
                  <td className="py-3 px-2.5 font-bold text-[#1B2130]">1</td>
                  <td className="py-3 px-2.5 text-[#5B6577]">Technical</td>
                  <td className="py-3 px-2.5 text-[#1B2130]">Fri, 3:00 PM (Online Google Meet)</td>
                  <td className="py-3 px-2.5 text-[#5B6577]">3 members (Lead: Dr. Kamal Hossain)</td>
                  <td className="py-3 px-2.5">
                    <span className="badge badge-blue">Engineering v2</span>
                  </td>
                  <td className="py-3 px-2.5">
                    <Link href="/interviews/evaluate" className="text-xs font-semibold text-[#0E7C66] hover:underline">
                      Evaluate →
                    </Link>
                  </td>
                </tr>
                <tr className="border-b border-[#E2E5EA] hover:bg-[#FAFBFC]">
                  <td className="py-3 px-2.5 font-bold text-[#1B2130]">2</td>
                  <td className="py-3 px-2.5 text-[#5B6577]">Culture fit</td>
                  <td className="py-3 px-2.5 text-[#8B98AD] italic">Not yet scheduled</td>
                  <td className="py-3 px-2.5 text-[#8B98AD]">—</td>
                  <td className="py-3 px-2.5 text-[#8B98AD]">—</td>
                  <td className="py-3 px-2.5">
                    <Link href="/interviews" className="text-xs font-semibold text-[#5B6577] hover:underline">
                      Schedule
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Profile" && (
        <div className="panel grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#1B2130] mb-3">Candidate Details</h3>
            <div className="space-y-2 text-xs">
              <div><span className="text-[#5B6577]">Full Name:</span> <span className="font-semibold text-[#1B2130]">{cand.firstName} {cand.lastName}</span></div>
              <div><span className="text-[#5B6577]">Email Address:</span> <span className="font-semibold text-[#1B2130]">{cand.email}</span></div>
              <div><span className="text-[#5B6577]">Phone Number:</span> <span className="font-semibold text-[#1B2130]">{cand.phone || "+880 1711 000111"}</span></div>
              <div><span className="text-[#5B6577]">Current Title:</span> <span className="font-semibold text-[#1B2130]">{cand.currentTitle || "Senior Software Engineer"}</span></div>
              <div><span className="text-[#5B6577]">Sourcing Channel:</span> <span className="badge badge-teal text-[11px] ml-1">{source}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B2130] mb-3">Recruitment Linkage</h3>
            <div className="space-y-2 text-xs">
              <div><span className="text-[#5B6577]">Position:</span> <span className="font-semibold text-[#1B2130]">{position}</span></div>
              <div><span className="text-[#5B6577]">Business Unit:</span> <span className="font-semibold text-[#1B2130]">Anwar Galvanizing / Tech</span></div>
              <div><span className="text-[#5B6577]">Current Stage:</span> <span className="badge badge-blue text-[11px] ml-1">{stage}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Documents" && (
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-3">Attached Documents</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E2E5EA] bg-[#FAFBFC]">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[#26568F]" />
                <div>
                  <div className="text-xs font-bold text-[#1B2130]">Farhan_Ahmed_Resume_2026.pdf</div>
                  <div className="text-[11px] text-[#5B6577]">Uploaded by Candidate · 1.4 MB · Verified</div>
                </div>
              </div>
              <span className="badge badge-teal">Verified</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Assessment" && (
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-2">Technical Screening Assessment</h3>
          <p className="text-xs text-[#5B6577] mb-4">Initial screening score: 85% — recommended for Panel Interview.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="kpi"><div className="num text-[#0E7C66]">85%</div><div className="label">Coding Score</div></div>
            <div className="kpi"><div className="num text-[#26568F]">90%</div><div className="label">System Design</div></div>
            <div className="kpi"><div className="num text-[#1B2130]">80%</div><div className="label">Database</div></div>
            <div className="kpi"><div className="num text-[#9A5B12]">Pass</div><div className="label">Eligibility</div></div>
          </div>
        </div>
      )}

      {activeTab === "Messages" && (
        <div className="panel">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1B2130]">Communication History</h3>
            <Link href="/messages" className="text-xs font-semibold text-[#0E7C66] hover:underline">
              Go to Message Queue →
            </Link>
          </div>
          <div className="p-3 rounded-lg border border-[#E2E5EA] bg-[#FAFBFC]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1B2130]">Interview Invitation — Round 1 Technical</span>
              <span className="badge badge-teal">Approved & Sent</span>
            </div>
            <p className="text-xs text-[#5B6577]">Delivered via Email · Fri, 10:00 AM</p>
          </div>
        </div>
      )}

      {activeTab === "History" && (
        <div className="panel">
          <h3 className="text-sm font-bold text-[#1B2130] mb-3">Stage History (Immutable Audit Trail)</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0E7C66] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[#1B2130]">Advanced to Interview Stage</div>
                <div className="text-[#5B6577] text-[11px]">By Recruiter (Rafiq Ahmed) · 2 days ago · Screening cleared</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#26568F] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[#1B2130]">Advanced to Screening Stage</div>
                <div className="text-[#5B6577] text-[11px]">By Recruiter (Rafiq Ahmed) · 5 days ago · Application received</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
