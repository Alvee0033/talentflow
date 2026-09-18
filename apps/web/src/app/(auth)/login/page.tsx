"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
  Building2,
  UserCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RoleOption {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  pass: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const ROLES: RoleOption[] = [
  {
    id: "recruiter",
    name: "Lead Recruiter",
    roleTitle: "RECRUITER",
    email: "recruiter@talentflow.anwargroup.com",
    pass: "Recruiter@123456",
    badge: "Core Workflow",
    description: "Pipeline tracking, candidate sourcing & scheduling",
    icon: Users,
  },
  {
    id: "tahead",
    name: "TA Head",
    roleTitle: "TA_ADMIN",
    email: "tahead@talentflow.anwargroup.com",
    pass: "TAHead@123456",
    badge: "Leadership",
    description: "Requisition oversight & message approval",
    icon: ShieldCheck,
  },
  {
    id: "depthead",
    name: "Department Head",
    roleTitle: "DEPT_HEAD",
    email: "depthead@talentflow.anwargroup.com",
    pass: "DeptHead@123456",
    badge: "Approver",
    description: "Headcount initiation & hiring decisions",
    icon: Building2,
  },
  {
    id: "panel",
    name: "Interview Panel",
    roleTitle: "PANEL_MEMBER",
    email: "panel@talentflow.anwargroup.com",
    pass: "Panel@123456",
    badge: "Evaluator",
    description: "Structured scoring & scorecard feedback",
    icon: UserCheck,
  },
  {
    id: "admin",
    name: "System Admin",
    roleTitle: "TECH_ADMIN",
    email: "admin@talentflow.anwargroup.com",
    pass: "Admin@123456",
    badge: "Superuser",
    description: "User management, workflow rules & audit logs",
    icon: KeyRound,
  },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRoleId(role.id);
    setEmail(role.email);
    setPassword(role.pass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both your corporate email and password.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      toast.success("Authentication successful! Welcome to Anwar TalentFlow.");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to authenticate. Please verify your credentials."
      );
      toast.error(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/20">
          TF
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Anwar TalentFlow
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Enterprise Talent Acquisition Platform &bull; Anwar Group of Industries
        </p>
      </div>

      {/* Role Selection Section */}
      <Card className="border border-slate-200 shadow-md bg-white">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Role Selection
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              Quick Switch
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Select your organization role to populate login credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRoleId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {r.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {r.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Login Card */}
      <Card className="border border-slate-200 shadow-lg bg-white">
        <CardHeader className="space-y-1 pb-3 pt-4 px-4 sm:px-5">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            Sign in with Credentials
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Direct database authentication with bcrypt hash verification
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Corporate Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@anwargroup.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRoleId(null);
                  }}
                  className="pl-9 h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-500"
                  required
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <a
                  href="/forgot-password"
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedRoleId(null);
                  }}
                  className="pl-9 pr-10 h-10 text-xs font-mono bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-500"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted with SHA-256 and RBAC Multi-Tier Authorization</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}