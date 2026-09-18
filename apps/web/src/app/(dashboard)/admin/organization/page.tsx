"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Building,
  Briefcase,
  Users,
  Loader2,
  Plus,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";

export default function OrganizationHierarchyPage() {
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuId, setSelectedBuId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [buRes, deptRes, posRes] = await Promise.all([
        adminApi.getBusinessUnits(),
        adminApi.getDepartments(),
        adminApi.getPositions(),
      ]);
      const buList = Array.isArray(buRes) ? buRes : buRes?.items || [];
      const dList = Array.isArray(deptRes) ? deptRes : deptRes?.items || [];
      const pList = Array.isArray(posRes) ? posRes : posRes?.items || [];
      setBusinessUnits(buList);
      setDepartments(dList);
      setPositions(pList);
      if (buList.length > 0) setSelectedBuId(buList[0].id);
    } catch {
      toast.error("Failed to load organization hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDepts = departments.filter((d) => !selectedBuId || d.businessUnitId === selectedBuId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Enterprise Organization Structure
          </h1>
          <Badge variant="purple" className="text-xs">
            Anwar Group of Industries
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Hierarchical organizational topology: Business Units, Operating Departments, and Position Profiles
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Business Units Bar */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {businessUnits.map((bu) => (
              <button
                type="button"
                key={bu.id}
                onClick={() => setSelectedBuId(bu.id)}
                className={`p-4 rounded-xl border text-left min-w-[240px] transition-all cursor-pointer ${
                  selectedBuId === bu.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {bu.code}
                  </span>
                  <Building2 className={`h-4 w-4 ${selectedBuId === bu.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="font-bold text-sm text-foreground mt-1">{bu.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{bu.description || "Business Unit"}</div>
              </button>
            ))}
          </div>

          {/* Departments & Positions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepts.map((dept) => {
              const deptPositions = positions.filter((p) => p.departmentId === dept.id);

              return (
                <Card key={dept.id} className="hover:border-primary/40 transition-all flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        {dept.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {deptPositions.length} Positions
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-1">
                      {dept.code} &bull; {dept.description || "Operational Unit"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="border-t pt-2 space-y-1.5 max-h-48 overflow-y-auto">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Standardized Position Profiles
                      </span>
                      {deptPositions.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No specific titles registered.</p>
                      ) : (
                        deptPositions.map((pos) => (
                          <div
                            key={pos.id}
                            className="p-1.5 rounded-md bg-muted/30 text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-foreground">{pos.title}</span>
                            <Badge variant="secondary" className="text-[9px]">
                              {pos.level || "Staff"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}