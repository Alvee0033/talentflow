import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  RESOURCES,
  ACTIONS,
  SystemRole,
  RequisitionStatus,
  ApprovalStatus,
  ApplicationStage,
  CandidateSourceType,
  InterviewStatus,
  EvaluationRecommendation,
  MessageChannel,
  MessageType,
  MessageStatus,
  TaskType,
  TaskPriority,
  TaskStatus,
  JoiningChecklistStatus,
  JoiningItemStatus,
  JoiningItemType,
} from '@talentflow/shared';

import { User } from '../../modules/iam/entities/user.entity';
import { Role } from '../../modules/iam/entities/role.entity';
import { Permission } from '../../modules/iam/entities/permission.entity';
import { RefreshToken } from '../../modules/iam/entities/refresh-token.entity';
import { BusinessUnit } from '../../modules/organization/entities/business-unit.entity';
import { Department } from '../../modules/organization/entities/department.entity';
import { Position } from '../../modules/organization/entities/position.entity';
import { Requisition } from '../../modules/requisition/entities/requisition.entity';
import { RequisitionApproval } from '../../modules/requisition/entities/requisition-approval.entity';
import { Candidate } from '../../modules/candidate/entities/candidate.entity';
import { Application } from '../../modules/candidate/entities/application.entity';
import { ApplicationStageHistory } from '../../modules/candidate/entities/application-stage-history.entity';
import { Screening } from '../../modules/candidate/entities/screening.entity';
import { Interview } from '../../modules/interview/entities/interview.entity';
import { InterviewPanelist } from '../../modules/interview/entities/interview-panelist.entity';
import { Evaluation } from '../../modules/interview/entities/evaluation.entity';
import { EvaluationForm } from '../../modules/interview/entities/evaluation-form.entity';
import { EvaluationCriteria } from '../../modules/interview/entities/evaluation-criteria.entity';
import { InterviewRescheduleHistory } from '../../modules/interview/entities/interview-reschedule-history.entity';
import { Message } from '../../modules/communication/entities/message.entity';
import { MessageTemplate } from '../../modules/communication/entities/message-template.entity';
import { MessageApproval } from '../../modules/communication/entities/message-approval.entity';
import { Task } from '../../modules/task/entities/task.entity';
import { Reminder } from '../../modules/task/entities/reminder.entity';
import { JoiningChecklist } from '../../modules/joining/entities/joining-checklist.entity';
import { JoiningChecklistItem } from '../../modules/joining/entities/joining-checklist-item.entity';
import { Document } from '../../modules/document/entities/document.entity';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';

// Load environment variables
function loadEnv(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv(path.resolve(__dirname, '../../../../../.env'));
loadEnv(path.resolve(__dirname, '../../../../.env'));
loadEnv(path.resolve(process.cwd(), '../../.env'));
loadEnv(path.resolve(process.cwd(), '.env'));

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'talentflow',
  password: process.env.DB_PASSWORD || 'talentflow_dev_password',
  database: process.env.DB_DATABASE || 'talentflow_dev',
  ssl: process.env.DB_SSL === 'true',
  synchronize: true,
  entities: [
    User,
    Role,
    Permission,
    RefreshToken,
    BusinessUnit,
    Department,
    Position,
    Requisition,
    RequisitionApproval,
    Candidate,
    Application,
    ApplicationStageHistory,
    Screening,
    Interview,
    InterviewPanelist,
    Evaluation,
    EvaluationForm,
    EvaluationCriteria,
    InterviewRescheduleHistory,
    Message,
    MessageTemplate,
    MessageApproval,
    Task,
    Reminder,
    JoiningChecklist,
    JoiningChecklistItem,
    Document,
    AuditLog,
  ],
});

async function runSeed() {
  console.log('Connecting to database for comprehensive seeding...');
  await AppDataSource.initialize();
  console.log('Connected successfully.');

  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const buRepo = AppDataSource.getRepository(BusinessUnit);
  const deptRepo = AppDataSource.getRepository(Department);
  const posRepo = AppDataSource.getRepository(Position);
  const reqRepo = AppDataSource.getRepository(Requisition);
  const apprRepo = AppDataSource.getRepository(RequisitionApproval);
  const candRepo = AppDataSource.getRepository(Candidate);
  const appRepo = AppDataSource.getRepository(Application);
  const stageHistRepo = AppDataSource.getRepository(ApplicationStageHistory);
  const evalFormRepo = AppDataSource.getRepository(EvaluationForm);
  const evalCritRepo = AppDataSource.getRepository(EvaluationCriteria);
  const interviewRepo = AppDataSource.getRepository(Interview);
  const panelistRepo = AppDataSource.getRepository(InterviewPanelist);
  const evalRepo = AppDataSource.getRepository(Evaluation);
  const msgTplRepo = AppDataSource.getRepository(MessageTemplate);
  const msgRepo = AppDataSource.getRepository(Message);
  const msgApprRepo = AppDataSource.getRepository(MessageApproval);
  const taskRepo = AppDataSource.getRepository(Task);
  const joiningRepo = AppDataSource.getRepository(JoiningChecklist);
  const joiningItemRepo = AppDataSource.getRepository(JoiningChecklistItem);

  // 1. Seed Permissions
  console.log('1. Seeding Permissions...');
  const allPermissions: Permission[] = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const name = `${resource}:${action}`;
      let perm = await permRepo.findOne({ where: { name } });
      if (!perm) {
        perm = permRepo.create({
          resource,
          action,
          name,
          description: `Permission to ${action} ${resource}`,
        });
        perm = await permRepo.save(perm);
      }
      allPermissions.push(perm);
    }
  }
  console.log(`Seeded ${allPermissions.length} permissions.`);

  const getPerms = (keys: string[]) => allPermissions.filter((p) => keys.includes(p.name));
  const getResourcePerms = (resources: string[], actions: string[]) =>
    allPermissions.filter((p) => resources.includes(p.resource) && actions.includes(p.action));

  // 2. Seed Default Roles
  console.log('2. Seeding Default Roles...');
  const roleDefinitions = [
    {
      name: SystemRole.TECH_ADMIN,
      description: 'Technical Administrator with full system, schema and infrastructure access',
      permissions: allPermissions,
    },
    {
      name: SystemRole.TA_ADMIN,
      description: 'Talent Acquisition Head with complete domain and governance access',
      permissions: allPermissions,
    },
    {
      name: SystemRole.RECRUITER,
      description: 'Recruiter managing candidate sourcing, interview scheduling and candidate pipeline',
      permissions: [
        ...getResourcePerms(
          ['requisition', 'candidate', 'application', 'interview', 'evaluation', 'message', 'task', 'joining', 'document', 'template', 'dashboard', 'report'],
          ['create', 'read', 'update', 'delete', 'export'],
        ),
        ...getPerms(['user:read', 'organization:read', 'approval-flow:read', 'evaluation-form:read', 'message:approve', 'application:approve', 'requisition:approve']),
      ],
    },
    {
      name: SystemRole.DEPT_HEAD,
      description: 'Department Head with departmental requisition and evaluation approval authority',
      permissions: getPerms([
        'requisition:create', 'requisition:read', 'requisition:update', 'requisition:approve',
        'candidate:read', 'application:read', 'application:approve',
        'interview:read', 'interview:create', 'evaluation:create', 'evaluation:read', 'evaluation:update',
        'report:read', 'dashboard:read',
        'user:read', 'organization:read', 'approval-flow:read', 'message:approve',
      ]),
    },
    {
      name: SystemRole.HIRING_MANAGER,
      description: 'Hiring Manager creating requisitions and evaluating candidates',
      permissions: getPerms([
        'requisition:create', 'requisition:read', 'requisition:update',
        'candidate:read', 'application:read', 'interview:read', 'interview:create',
        'evaluation:create', 'evaluation:read', 'evaluation:update', 'dashboard:read',
        'user:read', 'organization:read', 'message:approve',
      ]),
    },
    {
      name: SystemRole.PANEL_MEMBER,
      description: 'Interview Panel Member conducting interviews and evaluating candidates',
      permissions: getPerms([
        'interview:read', 'candidate:read', 'application:read',
        'evaluation:create', 'evaluation:read', 'evaluation:update',
        'user:read', 'organization:read', 'dashboard:read', 'task:read',
      ]),
    },
    {
      name: SystemRole.HR_LEADERSHIP,
      description: 'HR Leadership with executive approval and reporting visibility',
      permissions: getResourcePerms(
        ['requisition', 'candidate', 'application', 'interview', 'joining', 'report', 'dashboard', 'audit-log', 'organization', 'user'],
        ['read', 'export', 'approve'],
      ),
    },
    {
      name: SystemRole.AUDIT_USER,
      description: 'Auditor with read-only visibility into system records and audit logs',
      permissions: getResourcePerms(
        ['audit-log', 'report', 'requisition', 'candidate', 'user', 'role', 'organization', 'dashboard'],
        ['read', 'export'],
      ),
    },
  ];

  const rolesMap = new Map<string, Role>();
  for (const def of roleDefinitions) {
    let role = await roleRepo.findOne({
      where: { name: def.name },
      relations: ['permissions'],
    });

    if (!role) {
      role = roleRepo.create({
        name: def.name,
        description: def.description,
        isSystemRole: true,
        permissions: def.permissions,
      });
    } else {
      role.description = def.description;
      role.isSystemRole = true;
      role.permissions = def.permissions;
    }
    role = await roleRepo.save(role);
    rolesMap.set(def.name, role);
  }
  console.log(`Seeded ${rolesMap.size} system roles.`);

  // 3. Seed Users
  console.log('3. Seeding Users...');
  const taAdminRole = rolesMap.get(SystemRole.TA_ADMIN)!;
  const techAdminRole = rolesMap.get(SystemRole.TECH_ADMIN)!;
  const recruiterRole = rolesMap.get(SystemRole.RECRUITER)!;
  const deptHeadRole = rolesMap.get(SystemRole.DEPT_HEAD)!;
  const panelMemberRole = rolesMap.get(SystemRole.PANEL_MEMBER)!;

  // Admin User
  let adminUser = await userRepo.findOne({ where: { email: 'admin@talentflow.anwargroup.com' } });
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  if (!adminUser) {
    adminUser = userRepo.create({
      email: 'admin@talentflow.anwargroup.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Admin',
      employeeId: 'EMP-0001',
      phone: '+8801700000001',
      isActive: true,
      roles: [taAdminRole, techAdminRole],
    });
  } else {
    adminUser.passwordHash = adminPasswordHash;
    adminUser.roles = [taAdminRole, techAdminRole];
    adminUser.isActive = true;
  }
  adminUser = await userRepo.save(adminUser);

  // Recruiter User: Sarah Jenkins
  let recruiterUser = await userRepo.findOne({ where: { email: 'recruiter@talentflow.anwargroup.com' } });
  const recruiterPasswordHash = await bcrypt.hash('Recruiter@123456', 12);
  if (!recruiterUser) {
    recruiterUser = userRepo.create({
      email: 'recruiter@talentflow.anwargroup.com',
      passwordHash: recruiterPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      employeeId: 'EMP-0002',
      phone: '+8801700000002',
      isActive: true,
      roles: [recruiterRole],
    });
  } else {
    recruiterUser.passwordHash = recruiterPasswordHash;
    recruiterUser.roles = [recruiterRole];
    recruiterUser.isActive = true;
  }
  recruiterUser = await userRepo.save(recruiterUser);

  // Department Head User: Dr. Tariq Mahmood
  let deptHeadUser = await userRepo.findOne({ where: { email: 'depthead@talentflow.anwargroup.com' } });
  const deptHeadPasswordHash = await bcrypt.hash('DeptHead@123456', 12);
  if (!deptHeadUser) {
    deptHeadUser = userRepo.create({
      email: 'depthead@talentflow.anwargroup.com',
      passwordHash: deptHeadPasswordHash,
      firstName: 'Tariq',
      lastName: 'Mahmood',
      employeeId: 'EMP-0003',
      phone: '+8801700000003',
      isActive: true,
      roles: [deptHeadRole],
    });
  } else {
    deptHeadUser.passwordHash = deptHeadPasswordHash;
    deptHeadUser.roles = [deptHeadRole];
    deptHeadUser.isActive = true;
  }
  deptHeadUser = await userRepo.save(deptHeadUser);

  // TA Head User: Rashid Anwar
  let taHeadUser = await userRepo.findOne({ where: { email: 'tahead@talentflow.anwargroup.com' } });
  const taHeadPasswordHash = await bcrypt.hash('TAHead@123456', 12);
  if (!taHeadUser) {
    taHeadUser = userRepo.create({
      email: 'tahead@talentflow.anwargroup.com',
      passwordHash: taHeadPasswordHash,
      firstName: 'Rashid',
      lastName: 'Anwar',
      employeeId: 'EMP-0005',
      phone: '+8801700000005',
      isActive: true,
      roles: [taAdminRole],
    });
  } else {
    taHeadUser.passwordHash = taHeadPasswordHash;
    taHeadUser.roles = [taAdminRole];
    taHeadUser.isActive = true;
  }
  taHeadUser = await userRepo.save(taHeadUser);

  // Panel Member: Dr. Kamal Hossain (support both panelist@ and panel@)
  const panelPasswordHash = await bcrypt.hash('Panel@123456', 12);
  for (const pEmail of ['panelist@talentflow.anwargroup.com', 'panel@talentflow.anwargroup.com']) {
    let pUser = await userRepo.findOne({ where: { email: pEmail } });
    if (!pUser) {
      pUser = userRepo.create({
        email: pEmail,
        passwordHash: panelPasswordHash,
        firstName: 'Kamal',
        lastName: 'Hossain',
        employeeId: pEmail.startsWith('panelist') ? 'EMP-0006' : 'EMP-0006-P',
        phone: '+8801700000006',
        isActive: true,
        roles: [panelMemberRole],
      });
    } else {
      pUser.passwordHash = panelPasswordHash;
      pUser.roles = [panelMemberRole];
      pUser.isActive = true;
    }
    await userRepo.save(pUser);
  }
  let panelUser = (await userRepo.findOne({ where: { email: 'panelist@talentflow.anwargroup.com' } }))!;

  console.log('Seeded Users.');

  // 4. Seed Business Units
  console.log('4. Seeding Business Units...');
  const businessUnitsData = [
    { name: 'Anwar Galvanizing', code: 'AG', description: 'GI fittings, corrugated sheets, and galvanizing engineering' },
    { name: 'Anwar Cement', code: 'AC', description: 'Manufacturer of premium Portland composite cement and specialized cement products' },
    { name: 'Anwar Ispat', code: 'AI', description: 'Manufacturer of premium 500W steel rebars and structural steel' },
  ];

  const busMap = new Map<string, BusinessUnit>();
  for (const b of businessUnitsData) {
    let bu = await buRepo.findOne({ where: { code: b.code } });
    if (!bu) {
      bu = buRepo.create({ name: b.name, code: b.code, description: b.description, isActive: true });
      bu = await buRepo.save(bu);
    }
    busMap.set(b.code, bu);
  }

  // 5. Seed Departments
  console.log('5. Seeding Departments...');
  const departmentsData = [
    { name: 'Production', code: 'AG-PROD', buCode: 'AG' },
    { name: 'Quality Assurance', code: 'AG-QA', buCode: 'AG', headUserId: deptHeadUser.id },
    { name: 'Sales & Marketing', code: 'AG-SALES', buCode: 'AG' },
    { name: 'Operations', code: 'AC-OPS', buCode: 'AC' },
    { name: 'Maintenance', code: 'AC-MAINT', buCode: 'AC' },
    { name: 'Supply Chain', code: 'AC-SCM', buCode: 'AC' },
    { name: 'Metallurgy', code: 'AI-MET', buCode: 'AI', headUserId: deptHeadUser.id },
    { name: 'Plant Engineering', code: 'AI-ENG', buCode: 'AI' },
    { name: 'Logistics', code: 'AI-LOG', buCode: 'AI' },
  ];

  const deptsMap = new Map<string, Department>();
  for (const d of departmentsData) {
    let dept = await deptRepo.findOne({ where: { code: d.code } });
    const bu = busMap.get(d.buCode)!;
    if (!dept) {
      dept = deptRepo.create({
        name: d.name,
        code: d.code,
        businessUnitId: bu.id,
        headUserId: d.headUserId || null,
        isActive: true,
      });
      dept = await deptRepo.save(dept);
    }
    deptsMap.set(d.code, dept);
  }

  // Update DeptHead department assignment
  deptHeadUser.departmentId = deptsMap.get('AI-MET')!.id;
  await userRepo.save(deptHeadUser);

  // 6. Seed Positions
  console.log('6. Seeding Positions...');
  const positionsData = [
    { title: 'Senior Production Engineer', level: 'Senior', deptCode: 'AG-PROD' },
    { title: 'Galvanizing Line Supervisor', level: 'Mid', deptCode: 'AG-PROD' },
    { title: 'QA Inspector', level: 'Junior', deptCode: 'AG-QA' },
    { title: 'Lead Quality Analyst', level: 'Lead', deptCode: 'AG-QA' },
    { title: 'Plant Operator', level: 'Mid', deptCode: 'AC-OPS' },
    { title: 'Chief Operations Specialist', level: 'Lead', deptCode: 'AC-OPS' },
    { title: 'Maintenance Supervisor', level: 'Senior', deptCode: 'AC-MAINT' },
    { title: 'Mechanical Technician', level: 'Junior', deptCode: 'AC-MAINT' },
    { title: 'Senior Metallurgist', level: 'Senior', deptCode: 'AI-MET' },
    { title: 'Quality Control Specialist', level: 'Mid', deptCode: 'AI-MET' },
    { title: 'Plant Electrical Engineer', level: 'Mid', deptCode: 'AI-ENG' },
    { title: 'Logistics Coordinator', level: 'Junior', deptCode: 'AI-LOG' },
  ];

  const positionsMap = new Map<string, Position>();
  for (const p of positionsData) {
    const dept = deptsMap.get(p.deptCode)!;
    let pos = await posRepo.findOne({ where: { title: p.title, departmentId: dept.id } });
    if (!pos) {
      pos = posRepo.create({
        title: p.title,
        level: p.level,
        departmentId: dept.id,
        description: `Role responsibilities for ${p.title}`,
        isActive: true,
      });
      pos = await posRepo.save(pos);
    }
    positionsMap.set(`${p.deptCode}:${p.title}`, pos);
  }

  // 7. Seed Requisitions
  console.log('7. Seeding Requisitions...');
  const currentYear = new Date().getFullYear();
  const requisitionsData = [
    {
      requisitionNumber: `REQ-${currentYear}-0001`,
      title: 'Senior Metallurgist',
      buCode: 'AI',
      deptCode: 'AI-MET',
      posKey: 'AI-MET:Senior Metallurgist',
      headcount: 2,
      employmentType: 'FULL_TIME',
      experienceLevel: 'Senior',
      minSalary: 90000,
      maxSalary: 140000,
      currency: 'BDT',
      location: 'Munshiganj Plant, Bangladesh',
      isRemote: false,
      jobDescription: 'Responsible for overseeing metallurgical processes, furnace heat quality, and scrap steel composition analysis.',
      requirements: 'B.Sc in Materials & Metallurgical Engineering with 6+ years of induction/EAF furnace rebar steel manufacturing experience.',
      status: RequisitionStatus.OPEN,
      hiringManagerId: deptHeadUser.id,
      assignedRecruiterId: recruiterUser.id,
      openedAt: new Date(),
    },
    {
      requisitionNumber: `REQ-${currentYear}-0002`,
      title: 'Lead Quality Analyst',
      buCode: 'AG',
      deptCode: 'AG-QA',
      posKey: 'AG-QA:Lead Quality Analyst',
      headcount: 1,
      employmentType: 'FULL_TIME',
      experienceLevel: 'Lead',
      minSalary: 110000,
      maxSalary: 160000,
      currency: 'BDT',
      location: 'Tongi, Gazipur, Bangladesh',
      isRemote: false,
      jobDescription: 'Leading quality inspection protocols for zinc coating adherence and ISO 9001 compliance standards.',
      requirements: 'B.Sc in Mechanical/Industrial Engineering with 8+ years experience in quality assurance in steel galvanizing industry.',
      status: RequisitionStatus.AWAITING_APPROVAL,
      hiringManagerId: deptHeadUser.id,
      assignedRecruiterId: recruiterUser.id,
      openedAt: null,
      approvals: [
        { approverId: deptHeadUser.id, step: 1, status: ApprovalStatus.APPROVED },
        { approverId: adminUser.id, step: 2, status: ApprovalStatus.PENDING },
      ],
    },
    {
      requisitionNumber: `REQ-${currentYear}-0003`,
      title: 'Plant Operator',
      buCode: 'AC',
      deptCode: 'AC-OPS',
      posKey: 'AC-OPS:Plant Operator',
      headcount: 3,
      employmentType: 'FULL_TIME',
      experienceLevel: 'Mid',
      minSalary: 35000,
      maxSalary: 55000,
      currency: 'BDT',
      location: 'Meghnaghat, Narayanganj, Bangladesh',
      isRemote: false,
      jobDescription: 'Operate cement grinding mill machinery, monitor clinker feeding systems, and ensure optimal conveyor operations.',
      requirements: 'Diploma in Engineering with 3+ years cement factory operation experience.',
      status: RequisitionStatus.OPEN,
      hiringManagerId: deptHeadUser.id,
      assignedRecruiterId: recruiterUser.id,
      openedAt: new Date(),
    },
    {
      requisitionNumber: `REQ-${currentYear}-0004`,
      title: 'QA Inspector',
      buCode: 'AG',
      deptCode: 'AG-QA',
      posKey: 'AG-QA:QA Inspector',
      headcount: 2,
      employmentType: 'FULL_TIME',
      experienceLevel: 'Junior',
      minSalary: 25000,
      maxSalary: 35000,
      currency: 'BDT',
      location: 'Tongi, Gazipur, Bangladesh',
      isRemote: false,
      jobDescription: 'Conduct physical dimension and zinc micron tests on finished galvanized products.',
      requirements: 'Diploma in Mechanical Engineering or fresh B.Sc graduate.',
      status: RequisitionStatus.OPEN,
      hiringManagerId: deptHeadUser.id,
      assignedRecruiterId: recruiterUser.id,
      openedAt: new Date(),
    },
  ];

  const reqsMap = new Map<string, Requisition>();
  for (const r of requisitionsData) {
    let req = await reqRepo.findOne({ where: { requisitionNumber: r.requisitionNumber } });
    const bu = busMap.get(r.buCode)!;
    const dept = deptsMap.get(r.deptCode)!;
    const pos = positionsMap.get(r.posKey);

    if (!req) {
      req = reqRepo.create({
        requisitionNumber: r.requisitionNumber,
        title: r.title,
        businessUnitId: bu.id,
        departmentId: dept.id,
        positionId: pos ? pos.id : null,
        headcount: r.headcount,
        employmentType: r.employmentType,
        experienceLevel: r.experienceLevel,
        minSalary: r.minSalary,
        maxSalary: r.maxSalary,
        currency: r.currency,
        location: r.location,
        isRemote: r.isRemote,
        jobDescription: r.jobDescription,
        requirements: r.requirements,
        status: r.status,
        hiringManagerId: r.hiringManagerId,
        assignedRecruiterId: r.assignedRecruiterId,
        openedAt: r.openedAt,
      });
    } else {
      req.status = r.status;
      req.assignedRecruiterId = r.assignedRecruiterId;
      req.openedAt = r.openedAt;
    }
    req = await reqRepo.save(req);
    reqsMap.set(r.requisitionNumber, req);
  }

  // 8. Seed Evaluation Form & Criteria
  console.log('8. Seeding Evaluation Form & Rubric...');
  let evalForm = await evalFormRepo.findOne({ where: { title: 'Technical Engineering Assessment Scorecard' } });
  if (!evalForm) {
    evalForm = evalFormRepo.create({
      title: 'Technical Engineering Assessment Scorecard',
      description: 'Standardized evaluation form for engineering, technical, and plant operations candidates',
      departmentId: deptsMap.get('AI-MET')!.id,
      isActive: true,
    });
    evalForm = await evalFormRepo.save(evalForm);

    const criteriaData = [
      { name: 'Technical Depth & Core Domain Competency', description: 'Subject matter expertise, rebar manufacturing, and metallurgy knowledge', maxScore: 5, weight: 1.5, orderIndex: 1 },
      { name: 'Problem Solving & Fault Diagnosis', description: 'Ability to identify furnace heat issues and optimize production cycles', maxScore: 5, weight: 1.2, orderIndex: 2 },
      { name: 'Operational Safety & Compliance', description: 'Awareness of OSHA, ISO standards, and factory floor safety protocols', maxScore: 5, weight: 1.0, orderIndex: 3 },
      { name: 'Communication & Leadership', description: 'Clarity in technical reporting and coordination with plant technicians', maxScore: 5, weight: 1.0, orderIndex: 4 },
      { name: 'Culture & Anwar Group Values', description: 'Alignment with integrity, accountability, and operational excellence', maxScore: 5, weight: 0.8, orderIndex: 5 },
    ];

    for (const c of criteriaData) {
      const crit = evalCritRepo.create({ ...c, formId: evalForm.id });
      await evalCritRepo.save(crit);
    }
  }

  // 9. Seed Candidates and Applications across all pipeline stages
  console.log('9. Seeding Candidates & Active Applications across all 9 stages...');
  const openReq1 = reqsMap.get(`REQ-${currentYear}-0001`)!; // Senior Metallurgist
  const openReq2 = reqsMap.get(`REQ-${currentYear}-0003`)!; // Plant Operator

  const candidatesData = [
    {
      firstName: 'Tanvir',
      lastName: 'Rahman',
      email: 'tanvir.rahman@email.com',
      phone: '+8801811223344',
      currentCompany: 'BSRM Steels Ltd',
      currentTitle: 'Assistant Metallurgist',
      totalExperienceYears: 5.5,
      skills: ['EAF Furnace', 'Spectrometry', 'Continuous Casting', 'ISO 9001'],
      source: CandidateSourceType.JOB_PORTAL,
      stage: ApplicationStage.NEW,
      req: openReq1,
    },
    {
      firstName: 'Mahmudul',
      lastName: 'Hasan',
      email: 'mahmudul.hasan@email.com',
      phone: '+8801712345678',
      currentCompany: 'Abul Khair Steel',
      currentTitle: 'Quality Assurance Executive',
      totalExperienceYears: 6.0,
      skills: ['Metallurgical Testing', 'Tensile Strength', 'Alloy Analysis'],
      source: CandidateSourceType.REFERRAL,
      stage: ApplicationStage.SCREENING,
      req: openReq1,
    },
    {
      firstName: 'Shakil',
      lastName: 'Ahmed',
      email: 'shakil.ahmed@email.com',
      phone: '+8801912345678',
      currentCompany: 'GPH Ispat Ltd',
      currentTitle: 'Furnace Operations Engineer',
      totalExperienceYears: 7.2,
      skills: ['Induction Furnace', 'Slag Analysis', 'Refractory Lining'],
      source: CandidateSourceType.HEADHUNTER,
      stage: ApplicationStage.ASSESSMENT,
      req: openReq1,
    },
    {
      firstName: 'Dr. Nasir',
      lastName: 'Uddin',
      email: 'nasir.uddin@email.com',
      phone: '+8801612345678',
      currentCompany: 'KSRM Steel Plant',
      currentTitle: 'Senior Metallurgical Specialist',
      totalExperienceYears: 9.0,
      skills: ['Microstructure Analysis', 'Heat Treatment', 'Team Leadership'],
      source: CandidateSourceType.INTERNAL_POOL,
      stage: ApplicationStage.INTERVIEW,
      req: openReq1,
    },
    {
      firstName: 'Asif',
      lastName: 'Iqbal',
      email: 'asif.iqbal@email.com',
      phone: '+8801512345678',
      currentCompany: 'Crown Cement PLC',
      currentTitle: 'Senior Plant Operator',
      totalExperienceYears: 8.5,
      skills: ['Grinding Mills', 'Rotary Kilns', 'SCADA Control'],
      source: CandidateSourceType.JOB_PORTAL,
      stage: ApplicationStage.FEEDBACK_PENDING,
      req: openReq2,
    },
    {
      firstName: 'Zubair',
      lastName: 'Khan',
      email: 'zubair.khan@email.com',
      phone: '+8801798765432',
      currentCompany: 'Seven Rings Cement',
      currentTitle: 'Production Shift In-Charge',
      totalExperienceYears: 6.8,
      skills: ['Clinker Processing', 'Bag Filter Maintenance', 'PLC Systems'],
      source: CandidateSourceType.REFERRAL,
      stage: ApplicationStage.APPROVAL,
      req: openReq2,
    },
    {
      firstName: 'Farhan',
      lastName: 'Chowdhury',
      email: 'farhan.chowdhury@email.com',
      phone: '+8801898765432',
      currentCompany: 'Confidence Cement',
      currentTitle: 'Operations Technologist',
      totalExperienceYears: 7.0,
      skills: ['Cement Quality', 'Raw Mill Operation', 'Safety Protocols'],
      source: CandidateSourceType.CV_UPLOAD,
      stage: ApplicationStage.SELECTED,
      req: openReq2,
    },
    {
      firstName: 'Kazi',
      lastName: 'Arifur',
      email: 'kazi.arifur@email.com',
      phone: '+8801998765432',
      currentCompany: 'Bashundhara Cement',
      currentTitle: 'Shift Supervisor',
      totalExperienceYears: 5.2,
      skills: ['Packing Plant', 'Silo Management', 'Pneumatic Conveying'],
      source: CandidateSourceType.JOB_PORTAL,
      stage: ApplicationStage.JOINING,
      req: openReq2,
    },
    {
      firstName: 'Imran',
      lastName: 'Hossain',
      email: 'imran.hossain@email.com',
      phone: '+8801698765432',
      currentCompany: 'Premier Cement',
      currentTitle: 'Commissioning Engineer',
      totalExperienceYears: 4.8,
      skills: ['DCS Monitoring', 'Process Optimization'],
      source: CandidateSourceType.JOB_PORTAL,
      stage: ApplicationStage.JOINED,
      req: openReq2,
    },
  ];

  const seededApplications: Application[] = [];

  for (const c of candidatesData) {
    let cand = await candRepo.findOne({ where: { email: c.email } });
    if (!cand) {
      cand = candRepo.create({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        currentCompany: c.currentCompany,
        currentTitle: c.currentTitle,
        totalExperienceYears: c.totalExperienceYears,
        skills: c.skills,
        source: c.source,
        resumeUrl: `https://storage.talentflow.anwargroup.com/resumes/${c.firstName.toLowerCase()}_cv.pdf`,
      });
      cand = await candRepo.save(cand);
    }

    let app = await appRepo.findOne({ where: { candidateId: cand.id, requisitionId: c.req.id } });
    if (!app) {
      app = appRepo.create({
        candidateId: cand.id,
        requisitionId: c.req.id,
        stage: c.stage,
        nextAction: `Follow-up on ${c.stage} step`,
        nextActionOwnerId: recruiterUser.id,
        nextActionDueDate: new Date(Date.now() + 2 * 86400000),
      });
      app = await appRepo.save(app);

      // Audit log stage history
      const history = stageHistRepo.create({
        applicationId: app.id,
        fromStage: ApplicationStage.NEW,
        toStage: c.stage,
        changedById: recruiterUser.id,
        reason: 'Initial candidate profile advance',
        notes: `Candidate placed in ${c.stage} status during screening review.`,
      });
      await stageHistRepo.save(history);
    }
    app.candidate = cand;
    seededApplications.push(app);
  }
  console.log(`Seeded ${candidatesData.length} Candidates and Applications.`);

  // 10. Seed Interviews & Blind Evaluations
  console.log('10. Seeding Interview sessions and Blind Evaluations...');
  const interviewApp = seededApplications.find((a) => a.stage === ApplicationStage.INTERVIEW)!;
  const feedbackApp = seededApplications.find((a) => a.stage === ApplicationStage.FEEDBACK_PENDING)!;

  let interview1 = await interviewRepo.findOne({ where: { applicationId: interviewApp.id } });
  if (!interview1) {
    interview1 = interviewRepo.create({
      applicationId: interviewApp.id,
      title: 'Round 1: Technical & Metallurgical Process Interview',
      roundNumber: 1,
      scheduledStartTime: new Date(Date.now() + 86400000), // Tomorrow
      scheduledEndTime: new Date(Date.now() + 86400000 + 3600000),
      status: InterviewStatus.SCHEDULED,
      location: 'Anwar Ispat Plant HQ, Munshiganj & Virtual Meet',
      meetingLink: 'https://meet.google.com/xyz-anwar-tf',
      notes: 'Focus on spectrometry, melt temperature analysis, and continuous casting.',
      evaluationFormId: evalForm.id,
    });
    interview1 = await interviewRepo.save(interview1);

    // Add Panelists
    await panelistRepo.save(panelistRepo.create({ interviewId: interview1.id, userId: deptHeadUser.id, isLead: true }));
    await panelistRepo.save(panelistRepo.create({ interviewId: interview1.id, userId: panelUser.id, isLead: false }));
  }

  let interview2 = await interviewRepo.findOne({ where: { applicationId: feedbackApp.id } });
  if (!interview2) {
    interview2 = interviewRepo.create({
      applicationId: feedbackApp.id,
      title: 'Round 1: Plant Operations & Machinery Assessment',
      roundNumber: 1,
      scheduledStartTime: new Date(Date.now() - 86400000), // Yesterday
      scheduledEndTime: new Date(Date.now() - 86400000 + 3600000),
      status: InterviewStatus.COMPLETED,
      location: 'Anwar Cement Meghnaghat Plant',
      meetingLink: 'https://meet.google.com/ac-cement-tf',
      notes: 'Completed interview. Awaiting panel feedback submissions.',
      evaluationFormId: evalForm.id,
    });
    interview2 = await interviewRepo.save(interview2);

    await panelistRepo.save(panelistRepo.create({ interviewId: interview2.id, userId: deptHeadUser.id, isLead: true }));
    await panelistRepo.save(panelistRepo.create({ interviewId: interview2.id, userId: panelUser.id, isLead: false }));

    // Dept Head submitted evaluation (Blind rule demonstration)
    const eval1 = evalRepo.create({
      interviewId: interview2.id,
      panelistId: deptHeadUser.id,
      recommendation: EvaluationRecommendation.STRONGLY_RECOMMEND,
      overallScore: 4.8,
      criteriaRatings: {
        'Technical Depth': { score: 5, comment: 'Extensive background in grinding mills.' },
        'Problem Solving': { score: 5, comment: 'Solved critical scenario during troubleshooting test.' },
        'Safety': { score: 4.5, comment: 'Well-versed in plant safety standard operating procedures.' },
      },
      strengths: 'Remarkable diagnostic skills with heavy machinery and rotary kilns.',
      areasOfImprovement: 'Could improve formal ISO audit documentation format.',
      generalNotes: 'Top contender for the Plant Operator position.',
      isSubmitted: true,
      submittedAt: new Date(Date.now() - 43200000),
    });
    await evalRepo.save(eval1);
  }

  // 11. Seed Message Templates & Communication Records
  console.log('11. Seeding Message Templates & Communications...');
  const templatesData = [
    {
      name: 'Standard Interview Invitation',
      code: 'TPL-INT-INV-01',
      type: MessageType.INTERVIEW_INVITATION,
      channel: MessageChannel.EMAIL,
      subject: 'Interview Invitation: {{requisition.title}} at Anwar Group',
      bodyTemplate: 'Dear {{candidate.firstName}},\n\nWe are pleased to invite you for an interview for the {{requisition.title}} position at Anwar Group.\n\nDate: {{interview.date}}\nTime: {{interview.time}}\nMode: {{interview.link}}\n\nBest regards,\nTalent Acquisition Team\nAnwar Group of Industries',
    },
    {
      name: 'WhatsApp Interview Quick Reminder',
      code: 'TPL-INT-REM-01',
      type: MessageType.INTERVIEW_REMINDER,
      channel: MessageChannel.WHATSAPP,
      subject: null,
      bodyTemplate: 'Hi {{candidate.firstName}}, this is a friendly reminder of your upcoming interview tomorrow at {{interview.time}} for {{requisition.title}} with Anwar Group. Please join via: {{interview.link}}',
    },
    {
      name: 'Official Offer Selection Notification',
      code: 'TPL-OFFER-SEL-01',
      type: MessageType.SELECTION,
      channel: MessageChannel.EMAIL,
      subject: 'Congratulations: Offer of Employment - Anwar Group',
      bodyTemplate: 'Dear {{candidate.firstName}},\n\nOn behalf of Anwar Group of Industries, we are thrilled to inform you that you have been selected for the position of {{requisition.title}}!\n\nOur HR team will reach out with the comprehensive onboarding packet shortly.\n\nWarm regards,\nRashid Anwar\nVP People & Talent Acquisition',
    },
  ];

  for (const t of templatesData) {
    let tpl = await msgTplRepo.findOne({ where: { name: t.name } });
    if (!tpl) {
      tpl = msgTplRepo.create(t);
      await msgTplRepo.save(tpl);
    }
  }

  // Seed sample message awaiting approval
  const selApp = seededApplications.find((a) => a.stage === ApplicationStage.SELECTED)!;
  let msg1 = await msgRepo.findOne({ where: { applicationId: selApp.id } });
  if (!msg1) {
    msg1 = msgRepo.create({
      candidateId: selApp.candidateId,
      applicationId: selApp.id,
      channel: MessageChannel.EMAIL,
      type: MessageType.SELECTION,
      subject: `Offer of Employment: Plant Operator - Anwar Cement`,
      body: `Dear Farhan,\n\nWe are delighted to congratulate you on your selection for the Plant Operator position at Anwar Cement. Your compensation and joining formal documents are prepared for dispatch.\n\nWarm regards,\nTalent Acquisition Team`,
      recipientEmail: selApp.candidate.email,
      recipientPhone: selApp.candidate.phone,
      status: MessageStatus.AWAITING_APPROVAL,
      senderId: recruiterUser.id,
    });
    msg1 = await msgRepo.save(msg1);

    // Approval record
    const appr = msgApprRepo.create({
      messageId: msg1.id,
      approverId: adminUser.id,
      status: ApprovalStatus.PENDING,
    });
    await msgApprRepo.save(appr);
  }

  // 12. Seed Joining Checklist
  console.log('12. Seeding 13-Point Joining Checklist...');
  const joiningApp = seededApplications.find((a) => a.stage === ApplicationStage.JOINING)!;
  let checklist = await joiningRepo.findOne({ where: { applicationId: joiningApp.id } });
  if (!checklist) {
    checklist = joiningRepo.create({
      applicationId: joiningApp.id,
      candidateId: joiningApp.candidateId,
      joiningDate: new Date(Date.now() + 7 * 86400000), // Next week
      status: JoiningChecklistStatus.IN_PROGRESS,
      readinessPercentage: 61.54, // 8 of 13 completed
      notes: 'Onboarding packet dispatched, candidate completed medical clearances.',
    });
    checklist = await joiningRepo.save(checklist);

    const standardItems: { type: JoiningItemType; title: string; status: JoiningItemStatus }[] = [
      { type: JoiningItemType.CANDIDATE_ACCEPTANCE, title: 'Formal Offer Letter Signed & Accepted', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.REQUIRED_DOCUMENTS, title: 'Academic Certificates & NID Verification', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.REFERENCE_CHECK, title: 'Professional Background & Reference Checks Cleared', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.OFFER_LETTER, title: 'Countersigned Appointment Letter Issued', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.JOINING_DATE, title: 'Final Joining Date Agreement Reached', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.IT_REQUEST, title: 'Corporate Workstation & Plant Radio Requisition', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.WORKSPACE, title: 'Control Room Desk & Locker Allocation', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.ID_CARD, title: 'Biometric Access ID Card Generated', status: JoiningItemStatus.COMPLETED },
      { type: JoiningItemType.TRANSPORT, title: 'Factory Transport Route Assignment', status: JoiningItemStatus.IN_PROGRESS },
      { type: JoiningItemType.INDUCTION, title: 'Day-1 Corporate HR Induction Scheduled', status: JoiningItemStatus.PENDING },
      { type: JoiningItemType.DEPARTMENT_NOTIFICATION, title: 'Department Head & Shift Team Welcoming Notice', status: JoiningItemStatus.PENDING },
      { type: JoiningItemType.JOINING_COMPLETION, title: 'Physical Joining Report Sign-off', status: JoiningItemStatus.PENDING },
      { type: JoiningItemType.DEPARTMENTAL_HANDOVER, title: 'Safety Gear & Handover Briefing', status: JoiningItemStatus.PENDING },
    ];

    for (const item of standardItems) {
      const clItem = joiningItemRepo.create({
        checklistId: checklist.id,
        itemType: item.type,
        title: item.title,
        status: item.status,
        assignedToId: recruiterUser.id,
        dueDate: new Date(Date.now() + 5 * 86400000),
        completedAt: item.status === JoiningItemStatus.COMPLETED ? new Date() : null,
      });
      await joiningItemRepo.save(clItem);
    }
  }

  // 13. Seed Recruiter Tasks
  console.log('13. Seeding Operational Tasks & Reminders...');
  const tasksData = [
    {
      title: 'Review 3 New Candidate Applications for Senior Metallurgist',
      type: TaskType.REVIEW_CANDIDATE,
      priority: TaskPriority.HIGH,
      status: TaskStatus.OPEN,
      assigneeId: recruiterUser.id,
      creatorId: deptHeadUser.id,
      dueDate: new Date(Date.now() + 86400000),
    },
    {
      title: 'Dispatch Approved Offer Letter to Farhan Chowdhury',
      type: TaskType.APPROVE_MESSAGE,
      priority: TaskPriority.URGENT,
      status: TaskStatus.IN_PROGRESS,
      assigneeId: recruiterUser.id,
      creatorId: taHeadUser.id,
      dueDate: new Date(Date.now() + 43200000),
    },
    {
      title: 'Follow up on Dr. Kamal Hossain Interview Evaluation Scorecard',
      type: TaskType.SUBMIT_EVALUATION,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
      assigneeId: recruiterUser.id,
      creatorId: recruiterUser.id,
      dueDate: new Date(Date.now() + 172800000),
    },
    {
      title: 'Verify Factory Transport Route for Kazi Arifur',
      type: TaskType.JOINING_ITEM,
      priority: TaskPriority.LOW,
      status: TaskStatus.OPEN,
      assigneeId: recruiterUser.id,
      creatorId: taHeadUser.id,
      dueDate: new Date(Date.now() + 259200000),
    },
  ];

  for (const t of tasksData) {
    const existingTask = await taskRepo.findOne({ where: { title: t.title } });
    if (!existingTask) {
      const task = taskRepo.create(t);
      await taskRepo.save(task);
    }
  }

  console.log('✅ Full enterprise dataset seeded into PostgreSQL successfully!');
  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
