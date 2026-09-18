# Anwar TalentFlow &mdash; Enterprise Talent Acquisition Platform

> **Anwar Group of Industries** &bull; End-to-End Enterprise Talent Acquisition, Candidate Pipeline & Multi-Tier Recruitment Coordination System.

[![Repository](https://img.shields.io/badge/GitHub-Alvee0033%2Ftalentflow-blue?logo=github)](https://github.com/Alvee0033/talentflow)
[![Stack](https://img.shields.io/badge/Stack-NestJS%20%7C%20Next.js%2014%20%7C%20PostgreSQL%20%7C%20Turborepo-0E7C66)](https://github.com/Alvee0033/talentflow)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

---

## Table of Contents
1. [Platform Architecture](#platform-architecture)
2. [The 9 Canonical Recruitment Modules](#the-9-canonical-recruitment-modules)
3. [Pre-Configured Accounts & Credentials](#pre-configured-accounts--credentials)
4. [Prerequisites](#prerequisites)
5. [Quick Start & Step-by-Step Installation](#quick-start--step-by-step-installation)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Database Setup & Seeding](#database-setup--seeding)
8. [Running the Application](#running-the-application)
9. [Running with Docker](#running-with-docker)
10. [Automated Verification & Testing Suites](#automated-verification--testing-suites)
11. [Project Directory Layout](#project-directory-layout)
12. [API Reference & Swagger Documentation](#api-reference--swagger-documentation)

---

## Platform Architecture

TalentFlow is architected as a high-performance **Turborepo** monorepo workspace structured for industrial scalability, compliance, and strict multi-tier RBAC isolation:

```
├── apps/
│   ├── api/          # NestJS Modular Monolith API
│   │                 # (TypeORM, PostgreSQL, Redis Bull, JWT RBAC, Swagger, S3 Storage)
│   └── web/          # Next.js 14 App Router Corporate Portal
│                     # (React 18, Tailwind CSS, Shadcn UI, TanStack Query, Recharts)
├── packages/
│   └── shared/       # Shared TS packages (Enums, Interfaces, DTOs, Permissions, Stages)
├── scripts/          # Automated End-to-End Selenium & Compliance Test Suites
└── docker/           # Production Docker Compose, PostgreSQL, Redis, and Nginx configs
```

---

## The 9 Canonical Recruitment Modules

1. **Recruiter Dashboard (`/`)** &mdash; Central command center displaying live requisition funnels, interview velocity, urgent pending tasks, and real-time SLA metrics.
2. **Requisition Workspace (`/requisitions`)** &mdash; Multi-tier headcount request initiation, budget allocation, business unit assignment, and department approval routing.
3. **Candidate Pipeline (`/candidates`)** &mdash; Full visual Kanban and table workflow across all 9 pipeline stages: *New &rarr; Screening &rarr; Assessment &rarr; Interview &rarr; Feedback &rarr; Approval &rarr; Selected &rarr; Joining &rarr; Joined*.
4. **Candidate Workspace & Dossier (`/candidates/workspace`, `/candidates/[id]`)** &mdash; Comprehensive 360&deg; applicant profile, resume viewer, activity timeline, stage history, and communication logs.
5. **Interview Scheduling (`/interviews`)** &mdash; Conflict-free panel coordination, multi-round scheduling (Technical, Cultural, Management), room allocation, and automated calendar invitations.
6. **Interview Evaluation & Scorecards (`/interviews/evaluate`)** &mdash; Blind panelist scorecard rubric, multi-competence rating sliders, qualitative remarks, and automated recommendation consolidation.
7. **Two-Way Candidate Communication (`/messages`)** &mdash; Template-driven Email and WhatsApp dispatching with multi-tier approval gates for rejection and offer dispatches.
8. **Cross-Functional Joining Checklist Hub (`/joining`)** &mdash; Pre-boarding and day-one governance covering IT hardware provisioning, workspace allocation, document verification, and induction schedules.
9. **Management Dashboard & Analytics (`/dashboard/management`, `/reports`)** &mdash; Executive visibility into time-to-hire, source effectiveness, department cost-per-hire, offer acceptance ratios, and TA team throughput.

*Plus complete System Administration (`/admin/users`, `/admin/roles`, `/admin/organization`, `/admin/templates`, `/admin/evaluation-forms`, `/admin/approval-flows`, `/admin/audit-logs`).*

---

## Pre-Configured Accounts & Credentials

The seed script creates operational accounts across all core organizational tiers:

| Role Title | Name | Corporate Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Recruiter** | Rafiq Ahmed | `recruiter@talentflow.anwargroup.com` | `Recruiter@123456` | Sourcing, applicant pipeline, interviews, communication |
| **TA Head** | Rashid Anwar | `tahead@talentflow.anwargroup.com` | `TAHead@123456` | Requisition oversight, hiring approval, message queue review |
| **Department Head** | Tariq Hasan | `depthead@talentflow.anwargroup.com` | `DeptHead@123456` | Headcount demand initiation, hiring approval sign-off |
| **Interview Panel** | Dr. Kamal Hossain | `panel@talentflow.anwargroup.com` *(or `panelist@...`)* | `Panel@123456` | Technical evaluations, candidate scorecard submissions |
| **Hiring Manager** | Nasim Karim | `manager@talentflow.anwargroup.com` | `Manager@123456` | Requisition collaboration, departmental candidate reviews |
| **System Admin** | System Admin | `admin@talentflow.anwargroup.com` | `Admin@123456` | Full RBAC permissions, audit logs, template configurations |

> **Login Shortcut:** You can click on any role card in the **Role Selection** grid directly on the login page (`/login`) to automatically populate verified credentials.

---

## Prerequisites

Before setting up the project locally, ensure you have the following installed on your machine:

- **Node.js**: v18.18.0 or v20+ (`node -v`)
- **pnpm**: v8.0.0 or v9+ (`npm install -g pnpm`)
- **PostgreSQL**: v14+ running on port `5432`
- **Redis**: v6+ or v7+ running on port `6379`
- **Python 3** *(optional, for automated Selenium tests)*: with `selenium` (`pip install selenium`)

---

## Quick Start & Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Alvee0033/talentflow.git
cd talentflow
```

### 2. Install Workspace Dependencies
```bash
pnpm install
```

### 3. Build the Shared Core Library
Both the backend and frontend rely on the `@talentflow/shared` package:
```bash
pnpm --filter @talentflow/shared build
```

---

## Environment Variables Reference

The project includes a root `.env` file pre-configured for local development. If needed, create `.env` in the project root:

```env
# Node Environment
NODE_ENV=development

# API Server Configuration
PORT=3001
APP_URL=http://localhost:3002
API_URL=http://localhost:3001
API_PREFIX=api/v1

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=talentflow
DB_PASSWORD=talentflow_dev_password
DB_DATABASE=talentflow_dev
DB_SSL=false
DB_SYNCHRONIZE=true
DB_LOGGING=false

# Redis Cache & Bull Queues
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication & JWT
JWT_SECRET=super_secret_jwt_key_talentflow_anwargroup_2026_enterprise_production
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_talentflow_anwargroup_2026_enterprise
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# Web Client Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Storage (AWS S3 / MinIO Mock)
S3_REGION=ap-southeast-1
S3_BUCKET=talentflow-documents
S3_ACCESS_KEY_ID=mock-key
S3_SECRET_ACCESS_KEY=mock-secret
S3_ENDPOINT=

# Email SMTP Notification Engine
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@talentflow.anwargroup.com
```

---

## Database Setup & Seeding

### 1. Create PostgreSQL Database & User
Ensure PostgreSQL is running, then create the database and user:
```bash
sudo -u postgres psql -c "CREATE USER talentflow WITH PASSWORD 'talentflow_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE talentflow_dev OWNER talentflow;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talentflow_dev TO talentflow;"
```

### 2. Run Database Migrations & Seeds
Populate business units (Anwar Galvanizing, Anwar Cement, Anwar Ispat), departments, system roles, sample requisitions, applicants, and scorecards:
```bash
pnpm --filter @talentflow/api run seed
```

---

## Running the Application

### Option A: Run Both Services Concurrently
```bash
pnpm dev
```

### Option B: Run Services Individually

**Terminal 1 &mdash; Backend API (Port 3001):**
```bash
pnpm --filter @talentflow/api start:dev
```

**Terminal 2 &mdash; Frontend Web Application (Port 3002):**
```bash
pnpm --filter @talentflow/web dev -p 3002
```

### Accessing the Web Services:
- **Corporate Portal:** [http://localhost:3002](http://localhost:3002)
- **Login Screen:** [http://localhost:3002/login](http://localhost:3002/login)
- **API Swagger Documentation:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **API Health Endpoint:** [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

## Running with Docker

You can launch the complete ecosystem (API, Web, PostgreSQL, Redis) with a single command:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

To stop containers:
```bash
docker-compose -f docker/docker-compose.yml down
```

---

## Automated Verification & Testing Suites

The repository contains automated Python Selenium test scripts that validate all flows in headless Google Chrome:

```bash
# 1. Test clean login, absence of demo credentials, and session persistence across reload:
python3 scripts/verify_no_demo_cards.py

# 2. Test the Interactive Role Selection login for all accounts:
python3 scripts/test_role_section_login.py

# 3. Test Interview Panel login, RBAC permissions, and scorecard access:
python3 scripts/test_panel_member_login.py

# 4. Test Hiring Manager requisition creation & dynamic department dropdowns:
python3 scripts/test_hiring_manager_dropdown.py

# 5. Test Two-Way Message Approval Queue & Dispatches:
python3 scripts/test_screen7_message_approval.py

# 6. Run Full End-to-End Recruitment Lifecycle (Requisition -> Candidate -> Interview -> Offer):
python3 scripts/test_full_recruitment_lifecycle.py
```

---

## Project Directory Layout

```
talentflow/
├── .env                                  # Local development environment configuration
├── pnpm-workspace.yaml                   # Monorepo workspace definition
├── package.json                          # Root scripts & Turborepo tooling
├── packages/
│   └── shared/                           # @talentflow/shared library
│       ├── src/enums/                    # SystemRole, ApplicationStage, RequisitionStatus, etc.
│       ├── src/constants/                # Permissions, Stage flow transitions
│       └── src/types/                    # API response models & pagination schemas
├── apps/
│   ├── api/                              # NestJS Modular Monolith
│   │   ├── src/modules/
│   │   │   ├── iam/                      # Identity & Access (JWT, bcrypt, RBAC)
│   │   │   ├── organization/             # Business Units, Departments, Positions
│   │   │   ├── requisition/              # Requisitions & multi-level approval workflows
│   │   │   ├── candidate/                # Applicants, CV parse, Kanban stage history
│   │   │   ├── interview/                # Panel scheduling, scorecards & rubric evaluations
│   │   │   ├── communication/            # Email & WhatsApp templates with approval gates
│   │   │   ├── joining/                  # Onboarding & cross-functional checklist items
│   │   │   ├── dashboard/                # Role-specific analytics & summary KPIs
│   │   │   ├── report/                   # Pipeline metrics, time-to-hire, channel ROI
│   │   │   └── audit/                    # Tamper-evident operational audit logging
│   │   └── src/database/seeds/           # Enterprise seed data script
│   └── web/                              # Next.js 14 Web Application
│       ├── src/app/
│       │   ├── (auth)/login/             # Clean Enterprise Login with Role Selection
│       │   └── (dashboard)/              # Protected recruitment modules (1 through 9)
│       ├── src/components/               # Reusable UI component library (Shadcn + custom)
│       ├── src/lib/api/                  # Strongly typed API client services
│       └── src/providers/                # Auth, Query & Theme Context Providers
└── scripts/                              # Automated Selenium & verification test suites
```

---

## API Reference & Swagger Documentation

Once the backend is started, interactive OpenAPI/Swagger documentation with request/response schemas and execution tools is available at:

[http://localhost:3001/api/docs](http://localhost:3001/api/docs)

Key API Resource Endpoints:
- `POST /api/v1/auth/login` &mdash; Authenticate and issue JWT Access & Refresh tokens
- `POST /api/v1/auth/refresh` &mdash; Refresh expired access tokens
- `GET  /api/v1/requisitions` &mdash; List and filter requisitions with RBAC scoping
- `POST /api/v1/candidates` &mdash; Create candidate with CV attachment
- `GET  /api/v1/interviews` &mdash; Panel schedule and evaluation statuses
- `POST /api/v1/evaluations` &mdash; Submit candidate scorecard ratings
- `POST /api/v1/messages` &mdash; Draft communication requiring approval
- `GET  /api/v1/joining` &mdash; Onboarding compliance items status

---

## License

Copyright &copy; 2026 Anwar Group of Industries. All rights reserved.
Proprietary enterprise software developed for Anwar Talent Acquisition.
