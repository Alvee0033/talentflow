"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  Building,
  DollarSign,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requisitionsApi } from "@/lib/api/requisitions.api";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function NewRequisitionPage() {
  const router = useRouter();

  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid");
  const [headcount, setHeadcount] = useState(1);
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [targetHireDate, setTargetHireDate] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [location, setLocation] = useState("Dhaka Head Office");
  const [hiringManagerId, setHiringManagerId] = useState("");
  const [assignedRecruiterId, setAssignedRecruiterId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [buRes, usersRes] = await Promise.all([
          adminApi.getBusinessUnits(),
          adminApi.getUsers({ limit: 100 }).catch(() => ({ items: [] })),
        ]);
        const buList = Array.isArray(buRes) ? buRes : buRes?.items || [];
        setBusinessUnits(buList);
        if (buList.length > 0) {
          setBusinessUnitId(buList[0].id);
          const deptRes = await adminApi.getDepartments(buList[0].id);
          const deptList = Array.isArray(deptRes) ? deptRes : deptRes?.items || [];
          setDepartments(deptList);
          if (deptList.length > 0) {
            setDepartmentId(deptList[0].id);
          }
        }

        const userItems = usersRes?.items || [];
        // Classify recruiters vs hiring managers
        const recruiterList = userItems.filter((u: any) =>
          u.roles?.some((r: any) =>
            ["RECRUITER", "TA_ADMIN", "TECH_ADMIN"].includes(typeof r === "string" ? r : r.name)
          )
        );
        const managerList = userItems.filter((u: any) =>
          u.roles?.some((r: any) =>
            ["HIRING_MANAGER", "DEPT_HEAD", "TA_ADMIN", "TECH_ADMIN"].includes(typeof r === "string" ? r : r.name)
          )
        );

        const finalRecruiters = recruiterList.length > 0 ? recruiterList : userItems;
        const finalManagers = managerList.length > 0 ? managerList : userItems;

        setRecruiters(finalRecruiters);
        setManagers(finalManagers);

        if (finalRecruiters.length > 0) {
          setAssignedRecruiterId(finalRecruiters[0].id);
        }
        if (finalManagers.length > 0) {
          setHiringManagerId(finalManagers[0].id);
        }
      } catch (err) {
        toast.error("Failed to load organization metadata");
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, []);

  const handleBuChange = async (newBuId: string) => {
    setBusinessUnitId(newBuId);
    try {
      const deptRes = await adminApi.getDepartments(newBuId);
      const deptList = Array.isArray(deptRes) ? deptRes : deptRes?.items || [];
      setDepartments(deptList);
      if (deptList.length > 0) {
        setDepartmentId(deptList[0].id);
      } else {
        setDepartmentId("");
      }
    } catch {
      setDepartments([]);
      setDepartmentId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !businessUnitId || !departmentId || !jobDescription) {
      toast.error("Please fill in all required fields (Title, BU, Department, Description)");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        businessUnitId,
        departmentId,
        jobDescription,
        headcount: Number(headcount) || 1,
        experienceLevel,
        employmentType,
        location,
        requirements: requirements || undefined,
        minSalary: minSalary ? Number(minSalary) : undefined,
        maxSalary: maxSalary ? Number(maxSalary) : undefined,
        currency: "BDT",
        targetHireDate: targetHireDate ? new Date(targetHireDate).toISOString() : undefined,
        hiringManagerId: hiringManagerId || undefined,
        assignedRecruiterId: assignedRecruiterId || undefined,
      };

      const res = await requisitionsApi.create(payload);
      toast.success("Requisition created successfully!");
      router.push(`/requisitions/${res.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/requisitions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Requisitions
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-foreground">Create New Requisition</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Submit a new corporate headcount requirement for departmental and management approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Position Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Position Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Job Title / Role Title *</Label>
              <Input
                required
                id="title"
                name="title"
                data-testid="requisition-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior DevOps Engineer"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="businessUnitId" className="text-xs font-semibold">Business Unit *</Label>
                <select
                  id="businessUnitId"
                  name="businessUnitId"
                  data-testid="business-unit-select"
                  value={businessUnitId}
                  onChange={(e) => handleBuChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {businessUnits.length === 0 ? (
                    <option value="">No business units available</option>
                  ) : (
                    businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name} ({bu.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="departmentId" className="text-xs font-semibold">Department *</Label>
                <select
                  id="departmentId"
                  name="departmentId"
                  data-testid="department-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {departments.length === 0 ? (
                    <option value="">No departments available</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Headcount / Vacancies</Label>
                <Input
                  type="number"
                  min="1"
                  value={headcount}
                  onChange={(e) => setHeadcount(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Experience Level</Label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead / Staff</option>
                  <option value="Executive">Executive / Director</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Employment Type</Label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Salary (BDT)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Max Salary (BDT)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 80000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Hire Date</Label>
                <Input
                  type="date"
                  value={targetHireDate}
                  onChange={(e) => setTargetHireDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhaka Head Office / Chittagong"
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Stakeholders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              Stakeholders & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="assignedRecruiterId" className="text-xs font-semibold">Assigned Lead Recruiter *</Label>
              <select
                id="assignedRecruiterId"
                name="assignedRecruiterId"
                data-testid="assigned-recruiter-select"
                value={assignedRecruiterId}
                onChange={(e) => setAssignedRecruiterId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
              >
                {recruiters.length === 0 ? (
                  <option value="">No recruiters available</option>
                ) : (
                  recruiters.map((u) => {
                    const roleNames = u.roles?.map((r: any) => typeof r === "string" ? r : r.name).join(", ");
                    return (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} {roleNames ? `· ${roleNames}` : ""} ({u.email})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hiringManagerId" className="text-xs font-semibold">Hiring Manager *</Label>
              <select
                id="hiringManagerId"
                name="hiringManagerId"
                data-testid="hiring-manager-select"
                value={hiringManagerId}
                onChange={(e) => setHiringManagerId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
              >
                {managers.length === 0 ? (
                  <option value="">No hiring managers available</option>
                ) : (
                  managers.map((u) => {
                    const roleNames = u.roles?.map((r: any) => typeof r === "string" ? r : r.name).join(", ");
                    return (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} {roleNames ? `· ${roleNames}` : ""} ({u.email})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Job Description & Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Role Description & Context *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="jobDescription" className="text-xs font-semibold">Job Description *</Label>
              <Textarea
                required
                id="jobDescription"
                name="jobDescription"
                data-testid="job-description-input"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Detail the responsibilities, project scope, and team expectations..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Required Qualifications & Skills</Label>
              <Textarea
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. 5+ years experience, BSc in Computer Science, expertise in React & NestJS..."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/requisitions">
            <Button type="button" variant="outline" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-primary text-xs font-semibold px-6 gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit Requisition
          </Button>
        </div>
      </form>
    </div>
  );
}