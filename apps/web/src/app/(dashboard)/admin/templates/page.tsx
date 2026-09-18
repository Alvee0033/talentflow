"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Mail,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Code2,
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
import { messagesApi } from "@/lib/api/messages.api";
import { toast } from "sonner";

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Template Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [type, setType] = useState("INTERVIEW_INVITATION");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // View template modal
  const [viewingTemplate, setViewingTemplate] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await messagesApi.getTemplates();
      setTemplates(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load message templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !body) {
      toast.error("Please fill in template name, unique code, and body");
      return;
    }

    setIsCreating(true);
    try {
      await messagesApi.createTemplate({
        name,
        code,
        channel,
        type,
        subject: subject || undefined,
        body,
      });
      toast.success("Message template created successfully!");
      setIsCreateOpen(false);
      setName("");
      setCode("");
      setSubject("");
      setBody("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await messagesApi.deleteTemplate(id);
      toast.success("Template deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete template");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Candidate Communication Templates
            </h1>
            <Badge variant="purple" className="text-xs">
              {templates.length} Active Templates
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Standardized corporate emails & WhatsApp messages with Handlebars variable interpolation
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {tpl.code}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {tpl.channel === "WHATSAPP" ? (
                      <>
                        <Smartphone className="h-3 w-3 text-emerald-600" /> WhatsApp
                      </>
                    ) : (
                      <>
                        <Mail className="h-3 w-3 text-blue-600" /> Email
                      </>
                    )}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2">{tpl.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-1 font-mono">
                  {tpl.subject || "No subject header"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="p-2.5 rounded-lg bg-muted/30 text-xs text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                  {tpl.body}
                </div>
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingTemplate(tpl)}
                    className="h-7 text-xs"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tpl.id)}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Template Dialog */}
      {viewingTemplate && (
        <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{viewingTemplate.name}</DialogTitle>
                <Badge variant="outline" className="text-xs font-mono">{viewingTemplate.code}</Badge>
              </div>
              <DialogDescription className="text-xs">
                Channel: {viewingTemplate.channel} &bull; Type: {viewingTemplate.type}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              {viewingTemplate.subject && (
                <div className="p-2.5 rounded-lg bg-muted/40 font-semibold text-foreground">
                  Subject: {viewingTemplate.subject}
                </div>
              )}
              <div className="p-4 rounded-xl border bg-card whitespace-pre-line leading-relaxed text-muted-foreground font-mono">
                {viewingTemplate.body}
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setViewingTemplate(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Communication Template</DialogTitle>
            <DialogDescription className="text-xs">
              Set standard messaging copy with placeholders like {"{{candidate_name}}"} and {"{{requisition_title}}"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Template Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Assessment Invitation"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Template Code *</Label>
                <Input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. TPL-ASSESS-01"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Channel</Label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Message Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="INTERVIEW_INVITATION">Interview Invitation</option>
                  <option value="INTERVIEW_REMINDER">Interview Reminder</option>
                  <option value="RESCHEDULE">Reschedule Notice</option>
                  <option value="DOCUMENT_REQUEST">Document Request</option>
                  <option value="SELECTION">Selection & Offer</option>
                  <option value="REJECTION">Rejection Notice</option>
                  <option value="JOINING_REMINDER">Joining Reminder</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject Line (Email Only)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Next Steps with Anwar Group: {{requisition_title}}"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Message Body *</Label>
              <Textarea
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear {{candidate_name}}, ..."
                className="text-xs font-mono"
              />
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
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}