"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Default@123456");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Role Assignment Modal
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        adminApi.getUsers({ limit: 100 }),
        adminApi.getRoles().catch(() => []),
        adminApi.getDepartments().catch(() => []),
      ]);
      setUsers(uRes?.items || []);
      setRoles(Array.isArray(rRes) ? rRes : []);
      const deptList = Array.isArray(dRes) ? dRes : dRes?.items || [];
      setDepartments(deptList);
      if (deptList.length > 0) setSelectedDeptId(deptList[0].id);
      if (Array.isArray(rRes) && rRes.length > 0) setSelectedRoleId(rRes[0].id);
    } catch (err: any) {
      toast.error("Failed to load user administration data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all user details");
      return;
    }

    setIsCreating(true);
    try {
      const newUser = await adminApi.createUser({
        firstName,
        lastName,
        email,
        password,
        departmentId: selectedDeptId || undefined,
      });

      if (selectedRoleId) {
        await adminApi.assignRoles(newUser.id, [selectedRoleId]);
      }

      toast.success("User created successfully!");
      setIsCreateOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenRoleModal = (user: any) => {
    setRoleModalUser(user);
    const curRoleIds = user.roles?.map((r: any) => r.id) || [];
    setAssignedRoleIds(curRoleIds);
  };

  const handleSaveRoles = async () => {
    if (!roleModalUser) return;
    setIsSavingRoles(true);
    try {
      await adminApi.assignRoles(roleModalUser.id, assignedRoleIds);
      toast.success("Roles updated successfully!");
      setRoleModalUser(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign roles");
    } finally {
      setIsSavingRoles(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate/delete this user?")) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success("User deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const filtered = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const emailStr = (u.email || "").toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || emailStr.includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              User & Access Administration
            </h1>
            <Badge variant="purple" className="text-xs">
              {users.length} Active Accounts
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage corporate employee logins, department assignments, and RBAC role authorizations
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold bg-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 shadow-sm border">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Roles</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {u.department?.name || <span className="text-muted-foreground">General</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r: any) => (
                              <Badge key={r.id} variant="secondary" className="text-[10px]">
                                {r.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={u.isActive ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRoleModal(u)}
                            className="h-7 text-xs gap-1"
                          >
                            <Shield className="h-3 w-3 text-purple-600" />
                            Roles
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(u.id)}
                            className="h-7 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add System User</DialogTitle>
            <DialogDescription className="text-xs">
              Provision a new login account with secure role assignment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name *</Label>
                <Input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name *</Label>
                <Input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Address *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@anwargroup.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Temporary Password *</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Initial Role</Label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <Dialog open={!!roleModalUser} onOpenChange={() => setRoleModalUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Roles</DialogTitle>
              <DialogDescription className="text-xs">
                Select access roles for {roleModalUser.firstName} {roleModalUser.lastName} ({roleModalUser.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2 max-h-64 overflow-y-auto">
              {roles.map((r) => {
                const checked = assignedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedRoleIds([...assignedRoleIds, r.id]);
                        } else {
                          setAssignedRoleIds(assignedRoleIds.filter((id) => id !== r.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div>
                      <div className="font-bold text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoleModalUser(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRoles}
                disabled={isSavingRoles}
                className="bg-primary text-xs font-semibold gap-1.5"
              >
                {isSavingRoles && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Role Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}