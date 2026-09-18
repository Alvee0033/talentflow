"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  ArrowRight,
  Layers,
  Sparkles,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ApprovalFlowsAdminPage() {
  const [flows] = useState([
    {
      id: "flow-req-standard",
      name: "Standard Headcount Requisition Sanction",
      scope: "All Engineering & Corporate Roles",
      tiers: [
        { tier: 1, role: "Department Head", slaHours: 48, condition: "Mandatory for all new requisitions" },
        { tier: 2, role: "Head of Talent Acquisition", slaHours: 24, condition: "Recruiter assignment & sourcing allocation" },
        { tier: 3, role: "Group HR Director & Finance", slaHours: 72, condition: "Budget validation > BDT 100k/month" },
      ],
      status: "ACTIVE",
    },
    {
      id: "flow-offer-executive",
      name: "Executive & Director Level Offer Dispatch",
      scope: "Positions with Level >= Director",
      tiers: [
        { tier: 1, role: "Head of Talent Acquisition", slaHours: 24, condition: "Offer letter compilation & blind review check" },
        { tier: 2, role: "Managing Director / CEO", slaHours: 48, condition: "Final governance sign-off" },
      ],
      status: "ACTIVE",
    },
    {
      id: "flow-msg-approval",
      name: "Candidate External Outreach Gatekeeper",
      scope: "Offer & Rejection Messages",
      tiers: [
        { tier: 1, role: "Recruiter / TA Lead", slaHours: 12, condition: "Verification before email/WhatsApp dispatch" },
      ],
      status: "ACTIVE",
    },
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Multi-Tier Governance & Approval Workflows
          </h1>
          <Badge variant="purple" className="text-xs">
            Audit-Grade Enforced
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Corporate governance policy rules: Requisition sanction chains, compensation thresholds, and SLA alerts
        </p>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => (
          <Card key={flow.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base font-bold">{flow.name}</CardTitle>
                </div>
                <Badge variant="default" className="text-xs bg-emerald-600">
                  {flow.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Target Scope: <strong className="text-foreground">{flow.scope}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {flow.tiers.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border bg-muted/20 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Tier {t.tier} Sign-off
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {t.slaHours}h SLA
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-foreground">{t.role}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t.condition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}