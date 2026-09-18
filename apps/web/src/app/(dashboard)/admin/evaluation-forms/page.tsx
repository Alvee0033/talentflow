"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Star,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { interviewsApi } from "@/lib/api/interviews.api";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function EvaluationFormsAdminPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Form Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [criteria, setCriteria] = useState<{ name: string; description: string; maxScore: number }[]>([
    { name: "Technical Competence", description: "Depth of core domain skills", maxScore: 5 },
    { name: "Problem Solving", description: "Structured analytical debugging", maxScore: 5 },
    { name: "Communication", description: "Clarity in articulation", maxScore: 5 },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, dRes] = await Promise.all([
        interviewsApi.getEvaluationForms(),
        adminApi.getDepartments().catch(() => []),
      ]);
      setForms(Array.isArray(fRes) ? fRes : []);
      const deptList = Array.isArray(dRes) ? dRes : dRes?.items || [];
      setDepartments(deptList);
      if (deptList.length > 0) setSelectedDeptId(deptList[0].id);
    } catch {
      toast.error("Failed to load evaluation forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { name: "", description: "", maxScore: 5 }]);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Please enter a scorecard title");
      return;
    }

    setIsCreating(true);
    try {
      await interviewsApi.createEvaluationForm({
        name,
        description,
        departmentId: selectedDeptId || undefined,
        criteria,
      });
      toast.success("Evaluation form created successfully!");
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create evaluation form");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scorecard template?")) return;
    try {
      await interviewsApi.deleteEvaluationForm(id);
      toast.success("Evaluation form deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete evaluation form");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Interview Evaluation Scorecards
            </h1>
            <Badge variant="purple" className="text-xs">
              {forms.length} Scorecards
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Standardized evaluation rubrics and blind scoring forms across technical & executive panels
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Scorecard Template
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs border rounded-xl bg-card">
          No custom evaluation forms registered yet. The system falls back to universal Anwar Group rubrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f) => {
            const criteriaList = Array.isArray(f.criteria) ? f.criteria : [];

            return (
              <Card key={f.id} className="hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {f.department?.name || "All Departments"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {criteriaList.length} Criteria
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">{f.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {f.description || "Standardized panel rubric"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="border-t pt-2 space-y-1 max-h-36 overflow-y-auto text-xs">
                    {criteriaList.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between py-1 border-b text-[11px]">
                        <span className="font-semibold text-foreground truncate">{c.name}</span>
                        <span className="text-muted-foreground font-mono">Max: {c.maxScore || 5}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteForm(f.id)}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Evaluation Scorecard</DialogTitle>
            <DialogDescription className="text-xs">
              Define the competencies and scoring scale for interviewer evaluations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateForm} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Scorecard Title *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Senior Software Architect Assessment Rubric"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rubric scope..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Evaluation Criteria</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCriterion} className="h-6 text-[10px]">
                  + Add Criterion
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {criteria.map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-muted/20 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={c.name}
                        onChange={(e) => {
                          const copy = [...criteria];
                          copy[idx].name = e.target.value;
                          setCriteria(copy);
                        }}
                        placeholder="Criterion name"
                        className="col-span-2 h-7 text-xs"
                      />
                      <Input
                        type="number"
                        value={c.maxScore}
                        onChange={(e) => {
                          const copy = [...criteria];
                          copy[idx].maxScore = Number(e.target.value) || 5;
                          setCriteria(copy);
                        }}
                        placeholder="Max Score"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Scorecard
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}