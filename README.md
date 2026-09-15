# RailOpt-AI

### Intelligent Railway Maintenance Block Planning & Coordination System
**Smart India Hackathon (SIH 2026)**

> **Official Problem Statement:** AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways.

---

## 1. Product Overview

**RailOpt-AI** is a role-based railway maintenance planning, coordination, and execution platform tailored specifically for Indian Railways operations. 

On high-density trunk routes, train movements and infrastructure maintenance exist in perpetual tension. Track maintenance requires exclusive track possession ("maintenance blocks") across multiple engineering departments:
- **Engineering / Permanent Way (Track)**: Rails, switches, sleepers, ballast, USFD flaw detection.
- **Signal & Telecommunication (S&T)**: Signals, point machines, track circuits, axle counters, electronic interlocking.
- **Traction Distribution (TRD)**: Overhead equipment (OHE), 25kV catenary and contact wires, power-blocks.

Previously, maintenance block coordination was fragmented across departments, manually negotiated via phone calls, and prone to repeated possessions on the same section. 

**RailOpt-AI transforms this process into a unified, reliable workflow:**
1. **Record Maintenance Requests** quickly without technical jargon.
2. **Understand Urgency** with plain-language AI criticality scoring (0–100).
3. **Discover Feasible Windows** that fit task durations and respect passenger train movements.
4. **Generate Recommended Plans** powered by Google OR-Tools CP-SAT multi-department optimization behind the scenes.
5. **Review & Multi-Department Coordination** combining Engineering, S&T, and Traction into single coordinated block windows.
6. **Formal Approval Workflow** requiring Operations Manager review with full audit logging.
7. **Mobile-Friendly Field Execution** for inspectors to start work, upload photographic evidence, and complete checklists.
8. **Dynamic Emergency Replanning** when sudden failures occur, recalculating impacted blocks in seconds.

The AI/optimization complexity remains strictly behind the interface, so any railway engineer with basic computer literacy can navigate the entire system in seconds.

---

## 2. User Roles & Access Control (RBAC)

RailOpt-AI enforces strict Role-Based Access Control (RBAC) at **both the backend API level** (via granular permission dependencies) and the **UI navigation level**:

| Role | Default User | Permissions & Capabilities | Restrictions |
| :--- | :--- | :--- | :--- |
| **1. System Administrator** | `admin@railopt.demo` | Full access: user management, master data, solver telemetry, audit logs, demo reset. | None |
| **2. Operations Manager** | `manager@railopt.demo` | Divisional overview: approve/reject AI plans, request revisions, trigger emergency replans, view KPIs. | Cannot alter system users or security settings. |
| **3. Maintenance Engineer** | `engineer@railopt.demo` | Report maintenance requests, generate recommended AI plans, review tasks, submit plans for approval. | Cannot approve plans requiring manager authorization. |
| **4. Track Supervisor** | `track@railopt.demo` | Department view: track assets, rail defects, engineering crew schedules, track blocks. | Cannot see unrelated S&T or Traction admin data. |
| **5. S&T Engineer** | `signal@railopt.demo` | Signalling & telecom assets, point machine tasks, shared coordinated blocks. | Scoped to S&T department data. |
| **6. Traction Foreman** | `traction@railopt.demo` | Traction assets, OHE catenary tasks, power-block schedules, shared possessions. | Scoped to TRD department data. |
| **7. Field Inspector** | `inspector@railopt.demo` | Mobile-optimized view: today's assigned tasks, work instructions, start work, upload photo evidence, complete work. | Cannot alter plans or approve maintenance. |
| **8. Auditor / Safety Viewer** | `viewer@railopt.demo` | Read-only access: approved plans, execution records, safety checklists, audit logs, KPIs. | Cannot modify any operational records. |

---

## 3. End-to-End Workflow

Every major screen features a visual **9-Step Workflow Progress Indicator** showing users exactly where they are:

```text
1. Maintenance Reported
          ↓
2. AI Checks Urgency (0–100 score + plain-language explanation)
          ↓
3. Available Blocks Identified (Train timetable conflict check)
          ↓
4. AI Creates Recommended Plan (Google OR-Tools CP-SAT multi-crew solver)
          ↓
5. Engineer Reviews Plan (Schedule details + explainable [Why?] drawer)
          ↓
6. Manager Approves Plan (Formal review, change requests, or approval)
          ↓
7. Teams Execute Work (Mobile-friendly field execution with photo evidence)
          ↓
8. System Monitors Progress (Execution status, actual vs planned durations)
          ↓
9. New Problem? AI Re-plans (Instant recalculation for emergency failures)
```

### The 10-Second Rule
Upon login, every user's dashboard immediately answers **"What do I need to do now?"** with an **ACTION REQUIRED** section containing clear `[OPEN]` action buttons.

---

## 4. System Architecture

```text
                                  USERS
                         (Browser / Mobile Web)
                                    │
                                    ▼
                      React 18 + TypeScript + Vite
                       (Vanilla Tailwind CSS UI)
                                    │  (JWT Bearer)
                                    ▼
                        FastAPI Backend Engine
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      Authentication            Workflow             Notifications
       & RBAC Guard              Router                 Engine
             │                      │                      │
             ▼                      ▼                      ▼
     Maintenance Engine      Planning Engine        Execution Engine
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               ML Urgency       OR-Tools         Discrete
                Scorer           CP-SAT         Simulator
             (RandomForest)    (Optimizer)       Engine
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                               PostgreSQL /
                           SQLite (Single Source)
```

- **Core Planning Engine**: Pure deterministic Python + Google OR-Tools CP-SAT.
- **LLM Role (Optional)**: Natural-language assistant and report drafting. Scheduling is **never** delegated to an LLM.
- **Offline Resilience**: 100% of planning, optimization, and workflows function offline without any cloud or API dependencies.

---

## 5. Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

### Quick Setup

#### 1. Clone & Set Up Backend
```bash
cd railopt-ai/backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

#### 2. Seed Deterministic SIH Demo Database
From the `railopt-ai` root directory:
```bash
python scripts/seed_demo.py
```
*This deterministically creates all 8 user accounts, 3 corridors, 10 sections, 30 assets, 22 maintenance tasks, 14 block windows, 8 trains, 7 movements, and active plans.*

#### 3. Set Up Frontend
```bash
cd railopt-ai/frontend
npm install
```

---

## 6. Environment Variables

Create `.env` inside `backend/`:

```ini
# Application
PROJECT_NAME="RailOpt-AI"
SECRET_KEY="railopt-ai-super-secret-production-grade-jwt-key-2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Database (Default: SQLite file for zero-config demo; supports PostgreSQL)
DATABASE_URL="sqlite:///./railopt_demo.db"

# Optional Cloud LLM (System is 100% operational offline without it)
NVIDIA_API_KEY=
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_CHAT_MODEL=openai/gpt-oss-120b
```

---

## 7. Demo Accounts & Credentials

All demo accounts share the standard password: **`RailOpt@2026`**

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@railopt.demo` | `RailOpt@2026` | Admin Console, Audit Logs, Solver Telemetry |
| **Operations Manager** | `manager@railopt.demo` | `RailOpt@2026` | Approvals, Corridors, Emergency Replanning |
| **Maintenance Engineer** | `engineer@railopt.demo` | `RailOpt@2026` | New Maintenance, Plan Generation, Review |
| **Track Supervisor** | `track@railopt.demo` | `RailOpt@2026` | Track Assets, Defects, Engineering Work |
| **S&T Engineer** | `signal@railopt.demo` | `RailOpt@2026` | Signals, Interlocking, S&T Blocks |
| **Traction Foreman** | `traction@railopt.demo` | `RailOpt@2026` | OHE, Catenary, Power-Blocks |
| **Field Inspector** | `inspector@railopt.demo` | `RailOpt@2026` | Today's Work, Evidence Upload, Checklist |
| **Auditor / Viewer** | `viewer@railopt.demo` | `RailOpt@2026` | Safety Verification, Read-Only Audits |

*Tip: The UI features a 1-click **"Switch Demo Role"** button in the top navigation bar to instantaneously toggle between roles during judging.*

---

## 8. Complete Demo Scenario (SIH Judging Walkthrough)

To present the full end-to-end capability in under 5 minutes:

1. **Login as Maintenance Engineer** (`engineer@railopt.demo`):
   - Review urgent backlog on the Dashboard.
   - Click **"Report Maintenance"** to open the 5-step wizard.
   - Select Location `C2-02`, Asset `Track T-104`, Problem `Rail crack detected`, Severity `Critical`, Duration `2 hours`.
   - Observe instant **AI Prioritization** (Score: 92/100) with plain-language justifications (*Safety impact high, mainline passenger traffic affected*).
   - Navigate to **"Planning"** and click **"GENERATE MAINTENANCE PLAN"**.
   - Watch real backend solver phases evaluate train timetables and available blocks.
   - Click **"Submit for Approval"**.

2. **Switch to Operations Manager** (`manager@railopt.demo`):
   - Notice **"1 AI Plan Awaiting Approval"** under **ACTION REQUIRED**.
   - Open Plan review.
   - Inspect the **Smart Combination**: 3 activities (Engineering, S&T, Traction) scheduled inside one coordinated 2.5-hour block instead of 4 hours across 3 separate disruptions.
   - Click **[Why?]** to view plain-language decision reasoning.
   - Click **"Approve Plan"** (status moves to `SCHEDULED`).

3. **Switch to Field Inspector** (`inspector@railopt.demo`):
   - View assigned work at `C2-02` (14:00–16:30).
   - Click **"Start Work"** (status updates to `IN_PROGRESS`).
   - Upload completion photo/document evidence.
   - Enter actual duration (e.g. 110 minutes) and click **"Complete Work"**.

4. **Switch back to Operations Manager** (`manager@railopt.demo`):
   - Confirm task completed on Corridor C2.
   - Click **"Report Critical Event"** in the top bar.
   - Report a sudden **Signal Failure** on Section `C2-02` at 14:20.
   - Click **"Trigger Replan"**.
   - Review side-by-side comparison: impacted blocks shifted, conflicts resolved, updated timetable generated.

---

## 9. How Planning Works (Under the Hood)

The planning engine operates mathematically:
1. **Window Identification**: Checks the train timetable to find periods where track possession will not cause primary passenger train delays.
2. **Resource & Crew Verification**: Validates that required department teams (Gangs, S&T crews, OHE towers) are available and unbooked.
3. **Multi-Department Bundling**: Identifies tasks from different departments requiring the same corridor section and schedules them concurrently inside a single possession.
4. **CP-SAT Solver Execution**: Formulates task-to-window assignments as integer programming constraints and optimizes for maximum asset availability and minimum passenger disruption.
5. **Plan Validation**: Runs discrete checks ensuring no train collision, overlapping possession, or missing safety prerequisites exist.

---

## 10. How AI is Used

RailOpt-AI uses AI responsibly and deterministically:
- **ML Priority Scoring**: Evaluates asset age, traffic density, defect severity, and days overdue to calculate an objective 0–100 urgency score.
- **Explainability**: Translates complex mathematical trade-offs into plain English ("*Selected 14:00–16:30 because no passenger express conflict exists and S&T inspection can be performed concurrently*").
- **LLM Guardrails**: The LLM is used **strictly for report generation and conversational assistance**. It is **strictly prohibited from directly generating schedules or modifying constraints**.

---

## 11. How to Reset the Demo

If test data is modified during demonstration, the clean starting scenario can be restored in seconds:

### Method A: From the UI (Admin Role)
1. Log in as `admin@railopt.demo`.
2. Click **Admin Console** in the sidebar.
3. Click the red **"Reset Demo Scenario"** button.

### Method B: From Terminal
```bash
python scripts/seed_demo.py
```
This restores all deterministic accounts, corridors, assets, block windows, and active tasks.

---

## 12. Limitations

- Optimization operates on predefined block windows and timetable intervals; dynamic continuous-time dispatching is modeled at the section granularity.
- Weather impact is modeled as an empirical risk score rather than a real-time Doppler radar feed.
- Rolling stock rake maintenance (depots/sheds) is out of scope; focus is physical infrastructure (Permanent Way, S&T, TRD).

---

## 13. Synthetic Data Disclaimer

All railway corridors (e.g., *Corridor C1 Northern Trunk*, *Corridor C2 Western High-Density*), station codes, asset tags, train schedules, and defect records used in this prototype are **purely synthetic demo data created for academic and demonstration purposes in Smart India Hackathon (SIH 2026)**. No proprietary or classified Indian Railways operational data is contained herein.

---

## 14. Quick Commands Summary

| Action | Command |
| :--- | :--- |
| **Run All Tests** | `pytest tests/ -v` |
| **Seed Demo DB** | `python scripts/seed_demo.py` |
| **Start Backend** | `cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8100` |
| **Start Frontend** | `cd frontend && npm run dev` |
| **Build Frontend** | `cd frontend && npm run build` |
| **One-Click Start (Windows)** | `powershell -ExecutionPolicy Bypass -File .\start_railopt.ps1` |

### Isolated Ports
- **Frontend App**: [http://localhost:5180](http://localhost:5180)
- **Backend API**: [http://127.0.0.1:8100](http://127.0.0.1:8100)
- **Interactive Swagger Docs**: [http://127.0.0.1:8100/docs](http://127.0.0.1:8100/docs)

### Demo Accounts
All accounts use the local development password: `RailOpt@2026`
- **System Admin**: `admin@railopt.demo`
- **Operations Manager**: `manager@railopt.demo`
- **Maintenance Engineer**: `engineer@railopt.demo`
- **Track Engineer**: `track@railopt.demo`
- **S&T Engineer**: `signal@railopt.demo`
- **Traction Engineer**: `traction@railopt.demo`
- **Field Inspector**: `inspector@railopt.demo`
- **Viewer**: `viewer@railopt.demo`

