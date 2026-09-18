"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Lock,
  Key,
  CheckCircle2,
  Loader2,
  ChevronRight,
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
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create role modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // View permissions modal
  const [viewRole, setViewRole] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissions().catch(() => []),
      ]);
      setRoles(Array.isArray(rRes) ? rRes : []);
      setPermissions(Array.isArray(pRes) ? pRes : []);
    } catch {
      toast.error("Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) {
      toast.error("Please enter a role name");
      return;
    }

    setIsCreating(true);
    try {
      await adminApi.createRole({
        name: roleName,
        description,
        permissionIds: selectedPermissionIds,
      });
      toast.success("Role created successfully!");
      setIsCreateOpen(false);
      setRoleName("");
      setDescription("");
      setSelectedPermissionIds([]);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Role-Based Access Control (RBAC)
            </h1>
            <Badge variant="purple" className="text-xs">
              {roles.length} Roles Defined
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure system permissions, operational authority, and security policies
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const permCount = r.permissions?.length || 0;
            return (
              <Card key={r.id} className="hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                      {r.name}
                    </CardTitle>
                    <Badge variant={r.isSystem ? "secondary" : "outline"} className="text-[10px]">
                      {r.isSystem ? "System Preset" : "Custom Role"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {r.description || "Custom operational role"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between pt-3 border-t text-xs">
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{permCount}</strong> permissions active
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewRole(r)}
                      className="h-7 text-xs"
                    >
                      View Privileges
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Role Permissions Dialog */}
      {viewRole && (
        <Dialog open={!!viewRole} onOpenChange={() => setViewRole(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{viewRole.name}</DialogTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {viewRole.permissions?.length || 0} permissions
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                {viewRole.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
              {viewRole.permissions && viewRole.permissions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {viewRole.permissions.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-lg border bg-muted/20 text-xs font-mono flex items-center gap-1.5"
                    >
                      <Key className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{p.resource}:{p.action}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No explicit permissions assigned to this role.</p>
              )}
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setViewRole(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Security Role</DialogTitle>
            <DialogDescription className="text-xs">
              Define a new access role and select granted permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Role Name *</Label>
              <Input
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. TECHNICAL_INTERVIEWER"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Responsibilities and purpose of this role..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Granted Permissions ({selectedPermissionIds.length} Selected)</Label>
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 bg-muted/20">
                {permissions.map((p) => {
                  const isChecked = selectedPermissionIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-1.5 text-[11px] p-1.5 rounded hover:bg-background cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissionIds([...selectedPermissionIds, p.id]);
                          } else {
                            setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== p.id));
                          }
                        }}
                      />
                      <span className="font-mono truncate">{p.resource}:{p.action}</span>
                    </label>
                  );
                })}
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
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}