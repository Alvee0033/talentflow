"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ChevronLeft,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { candidatesApi } from "@/lib/api/candidates.api";
import { requisitionsApi } from "@/lib/api/requisitions.api";
import { toast } from "sonner";

export default function CandidateImportPage() {
  const router = useRouter();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadReqs() {
      try {
        const res = await requisitionsApi.getAll({ limit: 50 });
        const items = res?.items || [];
        setRequisitions(items);
        if (items.length > 0) {
          setSelectedReqId(items[0].id);
        }
      } catch (err) {
        // ignore
      }
    }
    loadReqs();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a spreadsheet file (.csv or .xlsx)");
      return;
    }

    setIsUploading(true);
    setImportResult(null);
    try {
      const res = await candidatesApi.importFile(selectedFile, selectedReqId || undefined);
      setImportResult(res);
      toast.success(`Import completed: ${res?.imported || 0} candidate(s) created!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process spreadsheet");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "firstName,lastName,email,phone,currentCompany,currentTitle,totalExperienceYears,source\n" +
      "Mahmudul,Hasan,mahmudul.hasan@example.com,+8801711998811,CloudTech BD,Senior Solutions Architect,7,LINKEDIN\n" +
      "Sabrina,Jahan,sabrina.jahan@example.com,+8801819223344,Fintech Lab,Full Stack Lead,5,REFERRAL\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "talentflow_candidate_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Candidates
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={downloadSampleCsv}
          className="text-xs h-8 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download Sample CSV Template
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-black text-foreground">Batch Candidate Sourcing Import</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Bulk import talent spreadsheets (.csv, .xlsx) with automatic duplicate validation
        </p>
      </div>

      <form onSubmit={handleImport} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Upload Spreadsheets
            </CardTitle>
            <CardDescription className="text-xs">
              Select a target open requisition and upload a valid candidate data file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Associate with Requisition (Optional)</label>
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Do not associate with a requisition (General Talent Pool)</option>
                {requisitions.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.requisitionNumber} - {req.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3 bg-muted/20 hover:bg-muted/30 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : "Select or drag & drop spreadsheet"}
                </p>
                <p className="text-xs text-muted-foreground">Supports .csv, .xlsx up to 10MB</p>
              </div>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" size="sm" className="text-xs cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isUploading || !selectedFile}
                className="bg-primary text-xs font-semibold px-6 gap-1.5"
              >
                {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Execute Batch Import
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Results Card */}
      {importResult && (
        <Card className="border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Batch Import Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-card rounded-lg border">
                <div className="text-muted-foreground">Total Rows Processed</div>
                <div className="text-xl font-bold text-foreground">{importResult.total || 0}</div>
              </div>
              <div className="p-3 bg-card rounded-lg border border-emerald-200">
                <div className="text-emerald-700 font-semibold">Successfully Imported</div>
                <div className="text-xl font-bold text-emerald-600">{importResult.imported || 0}</div>
              </div>
              <div className="p-3 bg-card rounded-lg border border-destructive/20">
                <div className="text-destructive font-semibold">Duplicates / Skipped</div>
                <div className="text-xl font-bold text-destructive">{importResult.skipped || 0}</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="p-3 bg-card rounded-lg border border-destructive/30 space-y-1">
                <div className="font-bold text-destructive">Row Warnings & Errors:</div>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {importResult.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link href="/candidates">
                <Button size="sm" className="text-xs">
                  View Updated Candidates Pipeline &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}