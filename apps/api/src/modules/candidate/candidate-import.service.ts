import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CandidatesService } from './candidates.service';
import { ApplicationsService } from './applications.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { CandidateSourceType } from '@talentflow/shared';

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: { row: number; reason: string }[];
}

@Injectable()
export class CandidateImportService {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly applicationsService: ApplicationsService,
    private readonly duplicateDetectionService: DuplicateDetectionService,
  ) {}

  async importFile(
    fileBuffer: Buffer,
    requisitionId?: string,
    currentUserId?: string,
  ): Promise<ImportResult> {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Could not parse spreadsheet file. Please upload valid CSV or XLSX.');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('The spreadsheet is empty.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

    if (!rawRows || rawRows.length === 0) {
      return { total: 0, imported: 0, duplicates: 0, errors: [] };
    }

    let imported = 0;
    let duplicates = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // header is row 1

      // Normalize field names (case-insensitive, trim)
      const normalizedRow: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase().replace(/[\s_]+/g, '');
        normalizedRow[cleanKey] = row[key];
      }

      const firstName =
        normalizedRow['firstname'] ||
        normalizedRow['first'] ||
        normalizedRow['name']?.toString().split(' ')[0] ||
        '';
      const lastName =
        normalizedRow['lastname'] ||
        normalizedRow['last'] ||
        normalizedRow['name']?.toString().split(' ').slice(1).join(' ') ||
        'Candidate';
      const email = normalizedRow['email'] || normalizedRow['emailaddress'] || '';
      const phone = normalizedRow['phone'] || normalizedRow['phonenumber'] || normalizedRow['mobile'] || null;
      const currentCompany = normalizedRow['company'] || normalizedRow['currentcompany'] || null;
      const currentTitle = normalizedRow['title'] || normalizedRow['currenttitle'] || normalizedRow['designation'] || null;
      const totalExperienceYears = Number(normalizedRow['experience'] || normalizedRow['totalexperience'] || normalizedRow['years'] || 0) || null;
      const skillsStr = normalizedRow['skills'] || '';
      const skills = skillsStr ? skillsStr.toString().split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean) : null;

      if (!email || !firstName) {
        errors.push({ row: rowNum, reason: 'Missing required field (firstName or email)' });
        continue;
      }

      // Check duplicates
      const dupCheck = await this.duplicateDetectionService.checkDuplicates({
        email,
        phone: phone ? String(phone) : undefined,
        firstName,
        lastName,
      });

      if (dupCheck.isDuplicate) {
        duplicates++;
        // If requisitionId is provided and candidate exists, we might want to attach existing candidate to requisition
        if (requisitionId && dupCheck.matches.length > 0) {
          try {
            await this.applicationsService.create(
              {
                candidateId: dupCheck.matches[0].candidate.id,
                requisitionId,
                notes: 'Imported from spreadsheet (existing candidate)',
              },
              currentUserId,
            );
          } catch {
            // Already applied or error
          }
        }
        continue;
      }

      try {
        const candidate = await this.candidatesService.create({
          firstName,
          lastName,
          email,
          phone: phone ? String(phone) : null,
          currentCompany,
          currentTitle,
          totalExperienceYears,
          source: CandidateSourceType.SPREADSHEET,
          sourceDetails: 'Imported via spreadsheet',
          skills,
        }, true);

        if (requisitionId) {
          await this.applicationsService.create(
            {
              candidateId: candidate.id,
              requisitionId,
              notes: 'Imported from spreadsheet',
            },
            currentUserId,
          );
        }

        imported++;
      } catch (err: any) {
        errors.push({ row: rowNum, reason: err.message || 'Failed to create candidate' });
      }
    }

    return {
      total: rawRows.length,
      imported,
      duplicates,
      errors,
    };
  }
}
