"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Loader2,
  ChevronRight,
  Filter,
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
import { StatusBadge } from "@/components/shared/status-badge";
import { tasksApi } from "@/lib/api/tasks.api";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function TasksManagementPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Create task modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [taskType, setTaskType] = useState("REVIEW_CANDIDATE");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, userRes] = await Promise.all([
        tasksApi.getAll({ limit: 100 }),
        adminApi.getUsers({ limit: 50 }).catch(() => ({ items: [] })),
      ]);
      setTasks(taskRes?.items || []);
      const uList = userRes?.items || [];
      setUsers(uList);
      if (uList.length > 0) setAssigneeId(uList[0].id);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId);
      toast.success("Task completed!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete task");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a task title");
      return;
    }

    setIsCreating(true);
    try {
      await tasksApi.create({
        title,
        description,
        priority,
        type: taskType,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId || undefined,
      });
      toast.success("Task created successfully!");
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const totalOpen = tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const highPriority = tasks.filter(
    (t) => (t.priority === "HIGH" || t.priority === "URGENT") && t.status !== "COMPLETED"
  ).length;
  const overdueCount = tasks.filter((t) => {
    if (t.status === "COMPLETED") return false;
    return t.dueDate && new Date(t.dueDate) < new Date();
  }).length;

  const filtered = tasks.filter((t) => {
    const matchSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              TA Operations & Task Coordination
            </h1>
            <Badge variant="purple" className="text-xs">
              Live Queue
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Stage action items, interview coordination deadlines, and operational checklists
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create New Task
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Pending Tasks
          </span>
          <div className="text-3xl font-black text-foreground">{totalOpen}</div>
          <div className="text-xs text-muted-foreground">Assigned across recruiting team</div>
        </Card>

        <Card className="p-4 space-y-1 border-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> High & Urgent Priority
          </span>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300">{highPriority}</div>
          <div className="text-xs text-amber-700/80">Requires immediate attention</div>
        </Card>

        <Card className="p-4 space-y-1 border-rose-300 bg-rose-50/40 dark:bg-rose-950/20">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-4 w-4 text-rose-600" /> Overdue SLAs
          </span>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-300">{overdueCount}</div>
          <div className="text-xs text-rose-700/80">Exceeded standard turnaround time</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 shadow-sm border">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full sm:w-44 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 w-full sm:w-44 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </Card>

      {/* Tasks Queue */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs border rounded-xl bg-card">
          No tasks found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const isDone = t.status === "COMPLETED";
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !isDone;

            return (
              <Card
                key={t.id}
                className={`hover:border-primary/40 transition-all shadow-sm ${
                  isDone ? "opacity-60 bg-muted/20" : ""
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => !isDone && handleCompleteTask(t.id)}
                      disabled={isDone}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white cursor-default"
                          : "border-muted-foreground/30 hover:border-primary cursor-pointer"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            isDone ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </span>
                        <StatusBadge status={t.status} />
                        <Badge
                          variant={
                            t.priority === "URGENT" || t.priority === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {t.priority}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] animate-pulse">
                            Overdue
                          </Badge>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
                        {t.assignee && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            {t.assignee.firstName} {t.assignee.lastName}
                          </span>
                        )}
                        {t.dueDate && (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              isOverdue ? "text-rose-600 font-bold" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-muted-foreground font-mono">
                          Type: {t.type?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isDone && (
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteTask(t.id)}
                        className="h-8 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                      >
                        Mark Done
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Operational Task</DialogTitle>
            <DialogDescription className="text-xs">
              Assign an action item to a recruiter, coordinator, or panelist.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Task Title *</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Follow up on reference check with previous employer"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description / Action Notes</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Context or instructions for the assignee..."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Task Type</Label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="REVIEW_CANDIDATE">Review Candidate</option>
                  <option value="SCHEDULE_INTERVIEW">Schedule Interview</option>
                  <option value="SUBMIT_EVALUATION">Submit Evaluation</option>
                  <option value="APPROVE_MESSAGE">Approve Message</option>
                  <option value="JOINING_ITEM">Joining Item</option>
                  <option value="CUSTOM">Custom Task</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Assignee</Label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
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
                disabled={isCreating || !title}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}