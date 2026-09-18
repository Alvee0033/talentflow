"use client";

import React from "react";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Building2, Bell, Lock, Key } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile preferences updated successfully");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account & System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your enterprise profile, security credentials, and organization preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 border shadow-sm bg-card">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl mb-2">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "TF"}
            </div>
            <CardTitle className="text-lg">{user ? `${user.firstName} ${user.lastName}` : "Enterprise User"}</CardTitle>
            <CardDescription className="text-xs truncate">{user?.email}</CardDescription>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {user?.roles?.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px]">
                  {r}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-2 text-xs space-y-3">
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-mono font-medium">{user?.employeeId || "EMP-001"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Organization</span>
              <span className="font-medium">Anwar Group of Industries</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="default" className="bg-emerald-600 text-[10px]">ACTIVE</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit & Security */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs">
                Your corporate identity information verified by Anwar HR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">First Name</Label>
                    <Input defaultValue={user?.firstName || "Rafiq"} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Last Name</Label>
                    <Input defaultValue={user?.lastName || "Ahmed"} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Corporate Email</Label>
                    <Input defaultValue={user?.email || "recruiter@talentflow.anwargroup.com"} disabled className="h-9 text-xs bg-muted/40 font-mono" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Contact Phone</Label>
                    <Input defaultValue={user?.phone || "+8801700000002"} className="h-9 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Security & Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Password credentials and two-factor authentication configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">Password Management</div>
                  <div className="text-[11px] text-muted-foreground">
                    Password was last updated via secure enterprise protocol
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Password update flow initialized")}>
                  Update Password
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">Session Tokens</div>
                  <div className="text-[11px] text-muted-foreground">
                    JWT Session Token active with 15m rotation
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
