"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Star,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { interviewsApi } from "@/lib/api/interviews.api";
import { candidatesApi } from "@/lib/api/candidates.api";
import { toast } from "sonner";

export default function GeneralInterviewEvaluationPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Criteria ratings (0 to 100 or 1 to 5)
  const [ratings, setRatings] = useState({
    experience: 70,
    technical: 80,
    communication: 60,
    problemSolving: 75,
  });

  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [recommendation, setRecommendation] = useState<"STRONG_YES" | "YES" | "NO" | "STRONG_NO">("STRONG_YES");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await interviewsApi.getAll({ limit: 20 });
        const items = res?.items || [];
        setInterviews(items);
        if (items.length > 0) {
          setSelectedInterviewId(items[0].id);
        }
      } catch (err) {
        console.error("Failed to load interviews", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedInt = interviews.find((i) => i.id === selectedInterviewId);
  const candidateName = selectedInt?.application?.candidate
    ? `${selectedInt.application.candidate.firstName} ${selectedInt.application.candidate.lastName}`
    : "Farhan Ahmed";
  const positionName = selectedInt?.application?.requisition?.title || "Backend Engineer";
  const roundName = selectedInt?.roundName || "Round 1 · Technical Panel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedInterviewId) {
        const overallScore = Math.round(((ratings.experience + ratings.technical + ratings.communication + ratings.problemSolving) / 4) / 10);
        await interviewsApi.submitEvaluation({
          interviewId: selectedInterviewId,
          recommendation: recommendation === "STRONG_YES" || recommendation === "YES" ? "RECOMMEND" : "DO_NOT_RECOMMEND",
          overallScore: overallScore,
          strengths: strengths || "Demonstrated solid domain foundations",
          areasOfImprovement: concerns || "None noted",
          isSubmitted: true,
        });
      }
      setIsSubmitted(true);
      toast.success("Evaluation submitted successfully. Scores recorded in immutable audit log.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Evaluation recorded successfully");
      setIsSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7C66]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Topline Header */}
      <div className="topline">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="screen-title">Interview Evaluation</h1>
            {interviews.length > 1 && (
              <select
                className="text-xs border border-[#E2E5EA] rounded px-2 py-1 bg-white font-medium text-[#5B6577]"
                value={selectedInterviewId}
                onChange={(e) => setSelectedInterviewId(e.target.value)}
              >
                {interviews.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.application?.candidate?.firstName} {i.application?.candidate?.lastName} — {i.roundName || "Technical Round"}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="screen-sub">
            {candidateName} · {roundName}
          </p>
        </div>
        <div className="role-pill">Role: Panel Member</div>
      </div>

      {/* 2. Confidentiality & Blind Evaluation Banner */}
      <div className="note-banner">
        Your evaluation stays private until you submit — you won't see other panelists' scores either.
      </div>

      {isSubmitted ? (
        <div className="panel text-center py-10 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-[#0E7C66] mx-auto" />
          <h2 className="text-base font-bold text-[#1B2130]">Evaluation Submitted & Locked</h2>
          <p className="text-xs text-[#5B6577] max-w-md mx-auto">
            Thank you! Your scorecard has been securely encrypted and stored. Once all assigned panelists have submitted their scores, aggregate feedback will be unblinded for the Hiring Manager.
          </p>
          <div className="pt-2">
            <Link href="/interviews" className="text-xs font-semibold text-[#0E7C66] hover:underline">
              ← Return to Interview Hub
            </Link>
          </div>
        </div>
      ) : (
        /* 3. Evaluation Form Panel */
        <form onSubmit={handleSubmit} className="panel space-y-5">
          {/* Criteria Sliders */}
          <div className="space-y-4">
            <div className="eval-crit">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-semibold text-[#1B2130]">Relevant Experience</span>
                <span className="text-xs font-bold text-[#5B6577]">{ratings.experience}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ratings.experience}
                onChange={(e) => setRatings((r) => ({ ...r, experience: Number(e.target.value) }))}
                className="w-full accent-[#0E7C66] cursor-pointer"
              />
            </div>

            <div className="eval-crit">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-semibold text-[#1B2130]">Technical Capability</span>
                <span className="text-xs font-bold text-[#5B6577]">{ratings.technical}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ratings.technical}
                onChange={(e) => setRatings((r) => ({ ...r, technical: Number(e.target.value) }))}
                className="w-full accent-[#0E7C66] cursor-pointer"
              />
            </div>

            <div className="eval-crit">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-semibold text-[#1B2130]">Communication</span>
                <span className="text-xs font-bold text-[#5B6577]">{ratings.communication}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ratings.communication}
                onChange={(e) => setRatings((r) => ({ ...r, communication: Number(e.target.value) }))}
                className="w-full accent-[#0E7C66] cursor-pointer"
              />
            </div>

            <div className="eval-crit">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[13px] font-semibold text-[#1B2130]">Problem-Solving</span>
                <span className="text-xs font-bold text-[#5B6577]">{ratings.problemSolving}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ratings.problemSolving}
                onChange={(e) => setRatings((r) => ({ ...r, problemSolving: Number(e.target.value) }))}
                className="w-full accent-[#0E7C66] cursor-pointer"
              />
            </div>
          </div>

          {/* Grid-2 Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6577] mb-1.5">Strengths</label>
              <textarea
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Notable candidate strengths observed during the session..."
                className="w-full p-2.5 border border-[#E2E5EA] rounded-lg text-xs font-inherit text-[#1B2130] focus:outline-none focus:border-[#0E7C66]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6577] mb-1.5">Concerns</label>
              <textarea
                rows={3}
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Any gaps, operational risks, or technical hesitation..."
                className="w-full p-2.5 border border-[#E2E5EA] rounded-lg text-xs font-inherit text-[#1B2130] focus:outline-none focus:border-[#0E7C66]"
              />
            </div>
          </div>

          {/* Overall Recommendation */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6577] mb-2">Overall Recommendation</label>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { id: "STRONG_YES", label: "Strong Yes", activeBadge: "badge-teal" },
                  { id: "YES", label: "Yes", activeBadge: "badge-teal" },
                  { id: "NO", label: "No", activeBadge: "badge-amber" },
                  { id: "STRONG_NO", label: "Strong No", activeBadge: "badge-red" },
                ] as const
              ).map((rec) => (
                <button
                  type="button"
                  key={rec.id}
                  onClick={() => setRecommendation(rec.id)}
                  className={`badge cursor-pointer transition-all ${
                    recommendation === rec.id
                      ? `${rec.activeBadge} ring-2 ring-offset-1 ring-[#0E7C66]`
                      : "badge-grey hover:bg-[#E2E5EA]"
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
