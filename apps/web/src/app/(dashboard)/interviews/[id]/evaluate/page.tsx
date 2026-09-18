"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ChevronLeft,
  Star,
  CheckCircle2,
  ShieldAlert,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { interviewsApi } from "@/lib/api/interviews.api";
import { EvaluationRecommendation } from "@talentflow/shared";
import { toast } from "sonner";

interface Criterion {
  id: string;
  name: string;
  description: string;
  score: number;
}

const DEFAULT_CRITERIA: Criterion[] = [
  {
    id: "tech",
    name: "Technical Competence & Domain Knowledge",
    description: "Demonstrated command of core concepts, distributed patterns, and production depth.",
    score: 4,
  },
  {
    id: "problem_solving",
    name: "Analytical Problem Solving",
    description: "Structured approach to complex problems, edge-case analysis, and algorithmic clarity.",
    score: 4,
  },
  {
    id: "communication",
    name: "Communication & Articulation",
    description: "Clarity in conveying technical concepts, active listening, and collaboration demeanor.",
    score: 4,
  },
  {
    id: "culture",
    name: "Cultural Alignment & Core Values",
    description: "Humility, accountability, ethics, and team-first orientation.",
    score: 5,
  },
];

export default function BlindEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.id as string;

  const [interview, setInterview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [strengths, setStrengths] = useState("");
  const [areasOfImprovement, setAreasOfImprovement] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [recommendation, setRecommendation] = useState<EvaluationRecommendation>(
    EvaluationRecommendation.RECOMMEND
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!interviewId) return;
      try {
        const intData = await interviewsApi.getById(interviewId);
        setInterview(intData);
      } catch (err) {
        toast.error("Failed to load interview for evaluation");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [interviewId]);

  const handleScoreChange = (id: string, score: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, score } : c)));
  };

  const calculateOverallScore = () => {
    if (criteria.length === 0) return 4;
    const sum = criteria.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round((sum / criteria.length) * 10) / 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewId) return;

    setIsSubmitting(true);
    try {
      const criteriaRatings: Record<string, { score: number; comment?: string }> = {};
      criteria.forEach((c) => {
        criteriaRatings[c.id] = { score: c.score, comment: c.name };
      });

      await interviewsApi.submitEvaluation({
        interviewId,
        recommendation,
        overallScore: calculateOverallScore(),
        criteriaRatings,
        strengths,
        areasOfImprovement,
        generalNotes,
        isSubmitted: true,
      });

      toast.success("Blind evaluation scorecard submitted successfully!");
      router.push(`/interviews/${interviewId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/interviews/${interviewId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Interview Workspace
        </Link>
      </div>

      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-foreground">
            Blind Evaluation Scorecard
          </h1>
          <Badge variant="purple" className="text-xs">
            Round {interview.roundNumber}: {interview.roundName}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Candidate: <strong className="text-foreground">{candName}</strong> &bull; Requisition:{" "}
          <strong className="text-foreground">{interview.application?.requisition?.title || "Role"}</strong>
        </p>
      </div>

      {/* Blind Protocol Banner */}
      <div className="p-4 rounded-xl border border-purple-300/40 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3">
        <Lock className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-foreground">
            Blind Evaluation Privacy Protocol Active
          </span>
          <p className="text-muted-foreground leading-relaxed">
            Other panelists' ratings and notes are strictly hidden from your view until your scorecard is submitted.
            This prevents anchoring bias and enforces objective hiring decisions across Anwar Group.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Criteria Rating Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Standardized Evaluation Criteria</CardTitle>
            <CardDescription className="text-xs">
              Rate each competence on a scale of 1 (Unsatisfactory) to 5 (Outstanding)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criteria.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border bg-muted/20 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs text-foreground">{c.name}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((scoreVal) => (
                      <button
                        type="button"
                        key={scoreVal}
                        onClick={() => handleScoreChange(c.id, scoreVal)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                          c.score === scoreVal
                            ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 scale-105"
                            : "bg-background text-muted-foreground hover:bg-muted border"
                        }`}
                      >
                        {scoreVal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Qualitative Feedback */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Qualitative Assessment & Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Key Strengths & Highlights *</Label>
              <Textarea
                required
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="What did the candidate demonstrate excellence in?"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Areas of Improvement / Gaps</Label>
              <Textarea
                rows={3}
                value={areasOfImprovement}
                onChange={(e) => setAreasOfImprovement(e.target.value)}
                placeholder="Where did the candidate fall short or show lack of depth?"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Overall Hiring Recommendation *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: EvaluationRecommendation.STRONGLY_RECOMMEND, label: "Strong Hire" },
                  { val: EvaluationRecommendation.RECOMMEND, label: "Hire" },
                  { val: EvaluationRecommendation.NEUTRAL, label: "Neutral / Borderline" },
                  { val: EvaluationRecommendation.DO_NOT_RECOMMEND, label: "Do Not Hire" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setRecommendation(item.val)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      recommendation === item.val
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Confidential Notes for Hiring Committee</Label>
              <Textarea
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Salary insights, leveling recommendations, or non-technical notes..."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/interviews/${interviewId}`}>
            <Button type="button" variant="outline" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !strengths}
            className="bg-primary text-xs font-semibold gap-1.5 px-6"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Send className="h-3.5 w-3.5" />
            Submit Final Scorecard
          </Button>
        </div>
      </form>
    </div>
  );
}
