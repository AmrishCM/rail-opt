import os
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from ...models import (
    User, Role, Permission, Division, UserRoleEnum, role_permissions,
    Asset, AssetType,
    Corridor, Section,
    MaintenanceTask, TaskStatus, TaskType,
    Train, TrainMovement, TrainType, TrainPriority,
    BlockWindow, BlockType, BlockStatus,
    Resource, Department, SkillLevel,
    MaintenancePlan, PlanAssignment, PlanStatus, PlanType, PlanApproval,
    CriticalEvent,
    ExecutionRecord, ExecutionStatus, FieldEvidence, Notification, AuditLog
)
from ...utils.security import get_password_hash
from ...ml.criticality import calculate_task_criticality
from ...ml.failure_prediction import predict_asset_failure

DEMO_PASSWORD = "RailOpt@2026"

def seed_database(db: Session, days: int = 7, reset: bool = True) -> Dict[str, int]:
    """
    Seeds database with realistic, deterministic, high-fidelity synthetic railway data
    for RailOpt-AI SIH 2026 demonstration.
    """
    if reset:
        # Clear existing records in reverse dependency order
        db.query(FieldEvidence).delete()
        db.query(ExecutionRecord).delete()
        db.query(Notification).delete()
        db.query(AuditLog).delete()
        db.query(PlanApproval).delete()
        db.query(PlanAssignment).delete()
        db.query(MaintenancePlan).delete()
        db.query(CriticalEvent).delete()
        db.query(TrainMovement).delete()
        db.query(Train).delete()
        db.query(BlockWindow).delete()
        db.query(MaintenanceTask).delete()
        db.query(Asset).delete()
        db.query(Section).delete()
        db.query(Corridor).delete()
        db.query(Resource).delete()
        db.query(Department).delete()
        db.query(User).delete()
        db.execute(role_permissions.delete())
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(Division).delete()
        db.commit()

    random.seed(42)
    # Fixed base time representing SIH demo day: 15 Sep 2026 09:00:00
    base_time = datetime(2026, 9, 15, 9, 0, 0)

    # 1. Permissions
    permissions_def = [
        ("maintenance:view", "View maintenance tasks and asset history"),
        ("maintenance:create", "Create new maintenance requests and defects"),
        ("maintenance:update", "Modify maintenance request details"),
        ("maintenance:edit", "Modify maintenance request details (legacy alias)"),
        ("maintenance:delete", "Delete or archive maintenance requests"),
        ("maintenance:approve", "Approve maintenance urgency classification"),

        ("issue:create", "Create new field defect or maintenance issue"),
        ("issue:view", "View maintenance issues"),
        ("issue:view_own", "View submitted field issues"),
        ("issue:review", "Review and prioritize incoming maintenance issues"),
        ("issue:update", "Update issue status"),

        ("planning:view", "View maintenance block plans and schedules"),
        ("planning:create", "Trigger AI plan generation"),
        ("planning:approve", "Approve maintenance block plans for corridor possession"),
        ("planning:reject", "Reject or request revisions for maintenance plans"),
        ("planning:replan", "Trigger dynamic replanning"),
        ("plan:create", "Trigger AI plan generation (alias)"),
        ("plan:view", "View maintenance block plans and schedules (alias)"),
        ("plan:approve", "Approve maintenance block plans (alias)"),
        ("plan:reject", "Reject maintenance block plans (alias)"),
        ("plan:replan", "Trigger dynamic replanning (alias)"),

        ("execution:view", "View execution records and field logs"),
        ("execution:start", "Mark maintenance block possession started"),
        ("execution:update", "Start work, complete tasks, and upload evidence"),
        ("execution:complete", "Mark maintenance block completed"),
        ("task:view_assigned", "View assigned tasks"),
        ("task:start", "Start assigned task"),
        ("task:pause", "Pause ongoing task"),
        ("task:complete", "Complete task with notes and evidence"),
        ("task:report_problem", "Report unexpected field problem or blocker"),

        ("timetable:view", "View corridor timetable and possession blocks"),

        ("emergency:create", "Report emergency defect and trigger dynamic replan"),
        ("emergency:view", "View emergency failure incidents"),

        ("reports:view", "View operational reports and KPI analytics"),

        ("users:view", "View system users and status"),
        ("users:create", "Create new system user"),
        ("users:update", "Update user details, roles, and status"),
        ("users:disable", "Deactivate or disable user account"),
        ("users:delete", "Remove user account"),
        ("users:manage", "Manage system users and access roles (alias)"),

        ("roles:view", "View roles and permission matrices"),
        ("roles:assign", "Assign roles to users"),

        ("system:settings", "Configure system parameters and solver weights"),
        ("system:audit", "Inspect compliance audit trails and security logs"),
        ("settings:manage", "Configure solver parameters and system settings (alias)"),
    ]

    perm_objs = {}
    for code, desc in permissions_def:
        p = Permission(code=code, description=desc)
        db.add(p)
        perm_objs[code] = p
    db.commit()

    # 2. Roles & Role-Permission Mappings
    roles_def = [
        ("SYSTEM_ADMIN", "System Administrator", "Full control over system, AI solver configuration, users, and audit logs",
         list(perm_objs.keys())),
        ("OPERATIONS_MANAGER", "Operations / Division Manager", "Reviews AI plans, approves/rejects blocks, emergency replanning, KPIs",
         ["maintenance:view", "maintenance:create", "issue:view", "issue:review", "planning:view", "planning:create", "planning:approve", "planning:reject", "planning:replan",
          "plan:create", "plan:view", "plan:approve", "plan:reject", "plan:replan", "execution:view", "timetable:view", "emergency:create", "emergency:view", "reports:view", "system:audit"]),
        ("MAINTENANCE_ENGINEER", "Maintenance Engineer", "Reports maintenance, reviews AI priority, generates plans, submits for approval",
         ["maintenance:view", "maintenance:create", "maintenance:update", "maintenance:edit", "issue:create", "issue:view", "planning:view", "planning:create", "planning:replan",
          "plan:create", "plan:view", "execution:view", "task:view_assigned", "task:start", "task:pause", "task:complete", "task:report_problem", "timetable:view", "emergency:create", "emergency:view", "reports:view"]),
        ("TRACK_USER", "Track Department User", "Permanent way assets, rail defects, and civil maintenance schedules",
         ["maintenance:view", "maintenance:create", "issue:create", "issue:view", "planning:view", "plan:view", "execution:view", "execution:start", "execution:update", "execution:complete", "task:view_assigned", "task:start", "task:complete", "task:report_problem", "timetable:view", "reports:view"]),
        ("SIGNAL_USER", "S&T Department User", "Signalling and telecommunication assets, point machines, and interlocking",
         ["maintenance:view", "maintenance:create", "issue:create", "issue:view", "planning:view", "plan:view", "execution:view", "execution:start", "execution:update", "execution:complete", "task:view_assigned", "task:start", "task:complete", "task:report_problem", "timetable:view", "reports:view"]),
        ("TRACTION_USER", "Traction Department User", "25kV OHE power-blocks, catenary lines, and tower wagon schedules",
         ["maintenance:view", "maintenance:create", "issue:create", "issue:view", "planning:view", "plan:view", "execution:view", "execution:start", "execution:update", "execution:complete", "task:view_assigned", "task:start", "task:complete", "task:report_problem", "timetable:view", "reports:view"]),
        ("FIELD_INSPECTOR", "Field Inspector / Supervisor", "Reports field defects, executes assigned work, records timestamps, uploads evidence",
         ["maintenance:view", "maintenance:create", "issue:create", "issue:view", "issue:view_own", "timetable:view", "planning:view", "plan:view", "execution:view", "execution:start", "execution:update", "execution:complete", "task:report_problem"]),
        ("AUDITOR_VIEWER", "Auditor / Safety Viewer", "Read-only access to approved plans, KPIs, safety compliance, and audit logs",
         ["maintenance:view", "issue:view", "planning:view", "plan:view", "execution:view", "timetable:view", "reports:view", "system:audit"]),
    ]

    role_objs = {}
    for name, disp, desc, perms in roles_def:
        r = Role(name=name, display_name=disp, description=desc)
        r.permissions = [perm_objs[p] for p in perms if p in perm_objs]
        db.add(r)
        role_objs[name] = r
    db.commit()

    # 3. Divisions
    div_dli = Division(name="Northern Trunk Division (Delhi - Kanpur)", code="DLI-CNB", headquarters="New Delhi")
    div_adi = Division(name="Western Feeder Division (Ahmedabad - Vadodara)", code="ADI-BRC", headquarters="Ahmedabad")
    div_asn = Division(name="Eastern Mineral Belt Division (Asansol - Dhanbad)", code="ASN-DHN", headquarters="Asansol")
    db.add_all([div_dli, div_adi, div_asn])
    db.commit()

    # 4. Demo Users (Hashed passwords: RailOpt@2026)
    hashed_pwd = get_password_hash(DEMO_PASSWORD)

    demo_users_data = [
        ("EMP-ADM-001", "admin@railopt.demo", "Suresh Kumar (Admin)", "SYSTEM_ADMIN", "Railway Board / IT", div_dli.division_id, "ALL"),
        ("EMP-MGR-002", "manager@railopt.demo", "Rajesh Sharma (Div Operations Mgr)", "OPERATIONS_MANAGER", "Operating Department", div_dli.division_id, "C2"),
        ("EMP-ENG-003", "engineer@railopt.demo", "Ravi Verma (Sr. Section Engineer)", "MAINTENANCE_ENGINEER", "Engineering/Track", div_dli.division_id, "C2"),
        ("EMP-TRK-004", "track@railopt.demo", "Anil Mehta (Track Supervisor)", "TRACK_USER", "Engineering/Track", div_dli.division_id, "C2"),
        ("EMP-SIG-005", "signal@railopt.demo", "Pooja Hegde (S&T Engineer)", "SIGNAL_USER", "S&T/Signalling", div_dli.division_id, "C2"),
        ("EMP-TRC-006", "traction@railopt.demo", "Vikram Rathore (Traction Foreman)", "TRACTION_USER", "Traction Distribution", div_dli.division_id, "C2"),
        ("EMP-INS-007", "inspector@railopt.demo", "Manoj Tiwari (Site Inspector)", "FIELD_INSPECTOR", "Engineering/Track", div_dli.division_id, "C2-02"),
        ("EMP-VIE-008", "viewer@railopt.demo", "Dr. K. Swaminathan (Safety Auditor)", "AUDITOR_VIEWER", "Safety Directorate", div_dli.division_id, "ALL"),
    ]

    user_objs = {}
    for emp_id, email, full_name, role_name, dept, div_id, sec in demo_users_data:
        u = User(
            employee_id=emp_id,
            email=email,
            full_name=full_name,
            hashed_password=hashed_pwd,
            role=role_name,
            role_id=role_objs[role_name].role_id,
            department=dept,
            division_id=div_id,
            section_code=sec,
            is_active=True
        )
        db.add(u)
        user_objs[role_name] = u
    db.commit()

    # 5. Departments
    depts_data = [
        ("Engineering/Track", "Permanent way, rail joints, ballast, switches and civil structures."),
        ("S&T/Signalling", "Electronic interlocking, automatic block signalling, point machines, and track circuits."),
        ("Traction Distribution", "25kV AC overhead equipment (OHE), feeder lines, switching posts, and pantograph contact."),
        ("Telecommunication", "OFC networks, train radio communication, axle counter circuits, and emergency communication.")
    ]
    dept_objs = {}
    for name, desc in depts_data:
        d = Department(name=name, description=desc, is_active=True)
        db.add(d)
        dept_objs[name] = d
    db.commit()

    # 6. Resources & Teams
    resources_data = [
        ("Engineering/Track", "Heavy Track Maintenance Gang", SkillLevel.EXPERT, 6, ["Tamper", "Rail Saw", "Weld Kit"]),
        ("Engineering/Track", "Ultrasonic Rail Testing Crew", SkillLevel.ADVANCED, 4, ["USFD Trolley", "Rail Tester"]),
        ("Engineering/Track", "Track Realignment Team 4", SkillLevel.INTERMEDIATE, 5, ["Hydraulic Jacks", "Gauge"]),
        ("S&T/Signalling", "Point Machine Overhaul Crew", SkillLevel.ADVANCED, 4, ["Torque Wrenches", "Megger", "Testing Rig"]),
        ("S&T/Signalling", "Electronic Interlocking Specialist", SkillLevel.EXPERT, 3, ["Logic Analyzer", "Relay Spares"]),
        ("Traction Distribution", "OHE Tower Wagon Unit", SkillLevel.EXPERT, 6, ["Tower Wagon", "Cantilever Spares", "Earthing Rods"]),
        ("Traction Distribution", "Catenary Inspection Squad", SkillLevel.ADVANCED, 5, ["Tensioner", "Ladder Trolley"]),
        ("Telecommunication", "OFC Splicing & Axle Counter Unit", SkillLevel.ADVANCED, 3, ["OTDR", "Fusion Splicer"])
    ]
    resource_objs = []
    for dept, skill, level, size, equip in resources_data:
        r = Resource(
            department=dept,
            skill=skill,
            skill_level=level,
            team_size=size,
            equipment=json.dumps(equip),
            location="Base Yard Central",
            max_hours_per_day=8,
            max_hours_per_week=40
        )
        db.add(r)
        resource_objs.append(r)
    db.commit()

    # 7. Corridors & Sections (Corridor 2 is C2: Western Feeder / Section C2-01, C2-02, C2-03)
    corridors_data = [
        (1, "Northern Trunk Corridor (NDLS - CNB)", "New Delhi", "Kanpur Central", 5, 24, [
            ("C1-01", 1, 0.0, 28.5, 28.5, 130, 2),
            ("C1-02", 2, 28.5, 62.0, 33.5, 130, 3),
            ("C1-03", 3, 62.0, 98.4, 36.4, 110, 4),
            ("C1-04", 4, 98.4, 134.0, 35.6, 120, 2)
        ]),
        (2, "Corridor C2 — Western Feeder (ADI - BRC)", "Ahmedabad", "Vadodara", 4, 18, [
            ("C2-01", 1, 0.0, 32.0, 32.0, 140, 2),
            ("C2-02", 2, 32.0, 68.5, 36.5, 130, 3),
            ("C2-03", 3, 68.5, 100.0, 31.5, 120, 3)
        ]),
        (3, "Eastern Mineral Belt (ASN - DHN)", "Asansol", "Dhanbad", 4, 20, [
            ("C3-01", 1, 0.0, 25.0, 25.0, 100, 3),
            ("C3-02", 2, 25.0, 58.0, 33.0, 90, 4),
            ("C3-03", 3, 58.0, 85.0, 27.0, 100, 3)
        ])
    ]

    sections_list = []
    c2_sections = []
    for c_id, name, start, end, traffic, cap, secs in corridors_data:
        c = Corridor(
            corridor_id=c_id,
            name=name,
            start_station=start,
            end_station=end,
            traffic_level=traffic,
            route_capacity=cap
        )
        db.add(c)
        db.flush()

        for s_name, num, skm, ekm, lkm, spd, comp in secs:
            sec = Section(
                corridor_id=c_id,
                name=s_name,
                section_number=num,
                start_km=skm,
                end_km=ekm,
                length_km=lkm,
                max_speed=spd,
                maintenance_complexity=comp
            )
            db.add(sec)
            sections_list.append(sec)
            if c_id == 2:
                c2_sections.append(sec)
    db.commit()

    # 8. Assets (30 assets with high realism)
    asset_defs = [
        # Corridor C2 Section C2-02 (Key Demo Area)
        (1, AssetType.TRACK, "Engineering/Track", 2, "Track T-104 (KM 42.8 Up Fast Line Rail Joint)", 95, "DEGRADED"),
        (2, AssetType.SIGNAL, "S&T/Signalling", 2, "Signal S-104 (Automatic Block Signal C2-02)", 92, "OPERATIONAL"),
        (3, AssetType.POINTS, "S&T/Signalling", 2, "Point Machine S-220 (Crossover 14B)", 88, "OPERATIONAL"),
        (4, AssetType.TRACTION, "Traction Distribution", 2, "OHE Tension Assembly TR-19 (Cantilever #44)", 89, "OPERATIONAL"),
        (5, AssetType.TRACK, "Engineering/Track", 2, "Track T-108 (Turnout Switch Tongue Rail)", 84, "OPERATIONAL"),
        (6, AssetType.TELECOM, "Telecommunication", 2, "Digital Axle Counter DA-204 (Detection Loop)", 80, "OPERATIONAL"),
        # Section C2-01
        (7, AssetType.TRACK, "Engineering/Track", 2, "Track T-101 (KM 14.2 Flash-butt Weld)", 76, "OPERATIONAL"),
        (8, AssetType.SIGNAL, "S&T/Signalling", 2, "Signal S-101 (Home Signal Approach)", 85, "OPERATIONAL"),
        (9, AssetType.TRACTION, "Traction Distribution", 2, "OHE Portal Feeder Wire C2-01", 78, "OPERATIONAL"),
        # Section C2-03
        (10, AssetType.TRACK, "Engineering/Track", 2, "Track T-112 (KM 88.4 Curve Realignment)", 82, "OPERATIONAL"),
        (11, AssetType.SIGNAL, "S&T/Signalling", 2, "Signal S-108 (Intermediate Block Signal)", 74, "OPERATIONAL"),
        (12, AssetType.TRACTION, "Traction Distribution", 2, "OHE Section Insulator SI-302", 79, "OPERATIONAL"),
        # Corridor 1 (NDLS - CNB)
        (13, AssetType.TRACK, "Engineering/Track", 1, "Track T-01 (KM 18.2 Expansion Joint)", 90, "OPERATIONAL"),
        (14, AssetType.SIGNAL, "S&T/Signalling", 1, "Signal S-04 (Electronic Interlocking Rack)", 91, "OPERATIONAL"),
        (15, AssetType.TRACTION, "Traction Distribution", 1, "OHE Substation Transformer SS-01", 86, "OPERATIONAL"),
        (16, AssetType.POINTS, "Engineering/Track", 1, "Switch Point P-12 at Ghaziabad Jn", 88, "OPERATIONAL"),
        (17, AssetType.TRACK, "Engineering/Track", 1, "Track T-05 (Ballast Deep Screening KM 45)", 83, "OPERATIONAL"),
        (18, AssetType.SIGNAL, "S&T/Signalling", 1, "Track Circuit TC-101 (Relay End)", 87, "OPERATIONAL"),
        (19, AssetType.TRACTION, "Traction Distribution", 1, "OHE Mast Ground Bond MG-18", 72, "OPERATIONAL"),
        (20, AssetType.TELECOM, "Telecommunication", 1, "OFC Joint Enclosure OFC-04", 75, "OPERATIONAL"),
        # Corridor 3 (ASN - DHN)
        (21, AssetType.TRACK, "Engineering/Track", 3, "Track T-301 (Heavy Haul Joint KM 12)", 93, "OPERATIONAL"),
        (22, AssetType.SIGNAL, "S&T/Signalling", 3, "Signal S-301 (Marshalling Yard Shunt)", 81, "OPERATIONAL"),
        (23, AssetType.TRACTION, "Traction Distribution", 3, "OHE Feeder Breaker FB-02", 84, "OPERATIONAL"),
        (24, AssetType.POINTS, "Engineering/Track", 3, "Diamond Crossing DC-01", 89, "OPERATIONAL"),
        (25, AssetType.TRACK, "Engineering/Track", 3, "Track T-304 (Sleeper Renewal KM 34)", 77, "OPERATIONAL"),
        (26, AssetType.SIGNAL, "S&T/Signalling", 3, "Axle Counter DA-301 (Up Coal Line)", 85, "OPERATIONAL"),
        (27, AssetType.TRACTION, "Traction Distribution", 3, "OHE Tension Wheel TW-09", 76, "OPERATIONAL"),
        (28, AssetType.TRACK, "Engineering/Track", 2, "Level Crossing LC-14 (Motorized Boom)", 82, "OPERATIONAL"),
        (29, AssetType.SIGNAL, "S&T/Signalling", 2, "Audio Frequency Track Circuit AFTC-22", 80, "OPERATIONAL"),
        (30, AssetType.TRACTION, "Traction Distribution", 2, "OHE Neutral Section Assembly NS-02", 87, "OPERATIONAL"),
    ]

    asset_objs = []
    for aid, atype, dept, cid, loc, crit, op_stat in asset_defs:
        fail_p = round(0.15 + (crit / 100.0) * 0.7, 2)
        ast = Asset(
            asset_id=aid,
            asset_type=atype,
            department=dept,
            corridor_id=cid,
            location=loc,
            criticality=crit,
            installation_date=base_time - timedelta(days=random.randint(500, 2000)),
            operating_status=op_stat,
            last_maintenance_date=base_time - timedelta(days=random.randint(15, 60)),
            next_due_date=base_time + timedelta(days=random.randint(2, 20)),
            meta_data=json.dumps({"failure_prob": fail_p, "section": loc.split()[0]})
        )
        db.add(ast)
        asset_objs.append(ast)
    db.commit()

    # 9. Maintenance Tasks (Including the Primary Demo Story Tasks)
    # Story:
    # 1. Track T-104 (CRITICAL rail crack detected, 2 hours, Engineering)
    # 2. Signal S-220 (Point machine inspection & contact test, 1 hour, S&T)
    # 3. OHE TR-19 (Cantilever insulator cleaning & tension check, 1 hour, Traction)
    # All 3 are located on Section C2-02 and can be SMARTLY COMBINED into 1 block of 2.5 hours!
    tasks_defs = [
        # Demo Critical Tasks on Section C2-02
        (1001, "MR-2026-00101", 1, "Engineering/Track", TaskType.CORRECTIVE, "Rail crack detected",
         "Ultrasonic testing detected 18mm transverse rail crack at weld joint", 10, 10, 120, "TRAFFIC_BLOCK", 92, 4),
        (1002, "MR-2026-00102", 3, "S&T/Signalling", TaskType.PREVENTIVE, "Point machine overhaul",
         "Crossover 14B point motor lubrication, contact resistance and throw testing", 7, 7, 60, "SIGNALLING_BLOCK", 75, 1),
        (1003, "MR-2026-00103", 4, "Traction Distribution", TaskType.PREVENTIVE, "OHE cantilever inspection",
         "25kV cantilever insulator soot cleaning, dropper alignment and earthing bond check", 8, 8, 60, "POWER_BLOCK", 78, 2),
        (1004, "MR-2026-00104", 5, "Engineering/Track", TaskType.CORRECTIVE, "Switch tongue wear",
         "Tongue rail lateral wear 5.8mm, replace switch rail and gauge tie plate", 8, 8, 90, "TRAFFIC_BLOCK", 82, 3),

        # Tasks across Corridor 2 (C2-01, C2-03)
        (1005, "MR-2026-00105", 7, "Engineering/Track", TaskType.PREVENTIVE, "Weld joint grinding",
         "De-hogging and rail profile grinding over 150m track length", 6, 5, 90, "TRAFFIC_BLOCK", 64, 0),
        (1006, "MR-2026-00106", 8, "S&T/Signalling", TaskType.CORRECTIVE, "Aspect lamp current drop",
         "Red aspect auxiliary LED array current drop below 120mA threshold", 9, 9, 45, "SIGNALLING_BLOCK", 88, 5),
        (1007, "MR-2026-00107", 9, "Traction Distribution", TaskType.PREVENTIVE, "Feeder wire thermography",
         "Infrared scan detected hot spot on feeder jumper clamp (58 deg C rise)", 7, 7, 60, "POWER_BLOCK", 72, 1),
        (1008, "MR-2026-00108", 10, "Engineering/Track", TaskType.CORRECTIVE, "Track gauge widening",
         "Gauge widened by +7mm on transition curve, tie tamping and realignment required", 8, 8, 120, "TRAFFIC_BLOCK", 84, 2),
        (1009, "MR-2026-00109", 11, "S&T/Signalling", TaskType.PREVENTIVE, "Relay room logic audit",
         "Electronic interlocking diagnostics download and warm standby sync verification", 6, 6, 60, "SIGNALLING_BLOCK", 60, 0),
        (1010, "MR-2026-00110", 12, "Traction Distribution", TaskType.CORRECTIVE, "Insulator soot accumulation",
         "Heavy cement dust deposition on neutral section insulator assembly", 8, 7, 75, "POWER_BLOCK", 79, 3),

        # Tasks across Corridor 1 (NDLS - CNB)
        (1011, "MR-2026-00111", 13, "Engineering/Track", TaskType.CORRECTIVE, "Breathing length gap opening",
         "Switch Expansion Joint (SEJ) gap exceeded 110mm during cold temperature excursion", 9, 9, 120, "TRAFFIC_BLOCK", 89, 4),
        (1012, "MR-2026-00112", 14, "S&T/Signalling", TaskType.CORRECTIVE, "Interlocking CPU bus error",
         "Intermittent communication error on CBI card rack slot 4", 9, 9, 60, "SIGNALLING_BLOCK", 90, 6),
        (1013, "MR-2026-00113", 15, "Traction Distribution", TaskType.PREVENTIVE, "Substation oil BDV test",
         "Breakdown voltage test for 132/25kV traction power transformer oil", 6, 6, 90, "POWER_BLOCK", 65, 0),
        (1014, "MR-2026-00114", 16, "Engineering/Track", TaskType.CORRECTIVE, "Crossing nose chipping",
         "Cast Manganese Steel (CMS) crossing nose chipped 3mm over 40mm length", 8, 8, 90, "TRAFFIC_BLOCK", 81, 2),
        (1015, "MR-2026-00115", 17, "Engineering/Track", TaskType.PREVENTIVE, "Ballast screening",
         "BCM machine run for drainage clearing and ballast cleaning", 6, 5, 150, "TRAFFIC_BLOCK", 62, 0),
        (1016, "MR-2026-00116", 18, "S&T/Signalling", TaskType.CORRECTIVE, "Track circuit ballast leakage",
         "Wet mud slurry causing track circuit drop under rainy condition", 8, 8, 75, "SIGNALLING_BLOCK", 83, 1),
        (1017, "MR-2026-00117", 19, "Traction Distribution", TaskType.PREVENTIVE, "Mast earthing replacement",
         "Corroded galvanized earthing strip renewal at portal mast", 5, 5, 45, "POWER_BLOCK", 55, 0),
        (1018, "MR-2026-00118", 20, "Telecommunication", TaskType.PREVENTIVE, "OFC attenuation test",
         "Optical time-domain reflectometer test on fiber cores 5 and 6", 6, 6, 60, "PARTIAL_BLOCK", 58, 0),

        # Tasks across Corridor 3 (ASN - DHN Coal Belt)
        (1019, "MR-2026-00119", 21, "Engineering/Track", TaskType.CORRECTIVE, "Rail corrugation wave wear",
         "Heavy freight axle wave wear on low rail of 4-degree curve", 8, 8, 120, "TRAFFIC_BLOCK", 85, 3),
        (1020, "MR-2026-00120", 22, "S&T/Signalling", TaskType.PREVENTIVE, "Yard shunt signal overhaul",
         "Shunt signal mechanical detection slide replacement and greasing", 6, 5, 60, "SIGNALLING_BLOCK", 61, 0),
        (1021, "MR-2026-00121", 23, "Traction Distribution", TaskType.CORRECTIVE, "SF6 circuit breaker leak",
         "Low gas pressure alarm on 25kV vacuum feeder circuit breaker", 9, 9, 75, "POWER_BLOCK", 88, 4),
        (1022, "MR-2026-00122", 24, "Engineering/Track", TaskType.CORRECTIVE, "Diamond crossing bolt shear",
         "Two check rail bolts sheared under coal freight rake movement", 9, 9, 60, "TRAFFIC_BLOCK", 87, 5),
    ]

    task_objs = []
    for tid, ref, aid, dept, ttype, dtype, desc, sev, safe, dur, blk_req, prio, overdue in tasks_defs:
        t = MaintenanceTask(
            task_id=tid,
            reference_no=ref,
            asset_id=aid,
            department=dept,
            task_type=ttype,
            defect_type=dtype,
            description=desc,
            severity=sev,
            detected_at=base_time - timedelta(days=random.randint(1, 10)),
            due_date=base_time + timedelta(days=random.randint(1, 5)),
            preferred_date=base_time + timedelta(hours=random.randint(4, 36)),
            estimated_duration=dur,
            required_block_type=blk_req,
            safety_impact=safe,
            failure_probability=round(0.2 + (prio / 100.0) * 0.7, 2),
            overdue_days=overdue,
            priority_score=prio,
            status=TaskStatus.OPEN,
            created_by_user_id=user_objs["MAINTENANCE_ENGINEER"].user_id
        )
        db.add(t)
        task_objs.append(t)
    db.commit()

    # 10. Block Windows for 15 Sep 2026
    # Specifically create the Key Windows on Corridor 2 Section C2-02:
    # 10:30 – 12:00 (Moderate train traffic)
    # 14:00 – 16:30 (RECOMMENDED: 2.5 hours, ideal for combined multi-crew block!)
    # 22:00 – 01:00 (Suitable: Night window)
    block_windows_defs = [
        # Corridor 2, Section C2-02 (Key Demo Corridor & Section)
        (1, 2, 2, datetime(2026, 9, 15, 10, 30), datetime(2026, 9, 15, 12, 0), 90, BlockType.COMBINED_BLOCK, 2, BlockStatus.AVAILABLE),
        (2, 2, 2, datetime(2026, 9, 15, 14, 0), datetime(2026, 9, 15, 16, 30), 150, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        (3, 2, 2, datetime(2026, 9, 15, 22, 0), datetime(2026, 9, 16, 1, 0), 180, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        # Corridor 2, Section C2-01
        (4, 2, 1, datetime(2026, 9, 15, 11, 0), datetime(2026, 9, 15, 13, 0), 120, BlockType.TRAFFIC_BLOCK, 1, BlockStatus.AVAILABLE),
        (5, 2, 1, datetime(2026, 9, 15, 14, 30), datetime(2026, 9, 15, 16, 30), 120, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        # Corridor 2, Section C2-03
        (6, 2, 3, datetime(2026, 9, 15, 13, 30), datetime(2026, 9, 15, 15, 30), 120, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        (7, 2, 3, datetime(2026, 9, 15, 23, 0), datetime(2026, 9, 16, 2, 0), 180, BlockType.FULL_BLOCK, 1, BlockStatus.AVAILABLE),
        # Corridor 1 (NDLS - CNB)
        (8, 1, 1, datetime(2026, 9, 15, 1, 0), datetime(2026, 9, 15, 4, 30), 210, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        (9, 1, 2, datetime(2026, 9, 15, 11, 30), datetime(2026, 9, 15, 13, 30), 120, BlockType.TRAFFIC_BLOCK, 2, BlockStatus.AVAILABLE),
        (10, 1, 3, datetime(2026, 9, 15, 14, 0), datetime(2026, 9, 15, 16, 30), 150, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        (11, 1, 4, datetime(2026, 9, 15, 23, 0), datetime(2026, 9, 16, 2, 30), 210, BlockType.FULL_BLOCK, 1, BlockStatus.AVAILABLE),
        # Corridor 3 (ASN - DHN)
        (12, 3, 1, datetime(2026, 9, 15, 2, 0), datetime(2026, 9, 15, 5, 0), 180, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
        (13, 3, 2, datetime(2026, 9, 15, 12, 0), datetime(2026, 9, 15, 14, 0), 120, BlockType.TRAFFIC_BLOCK, 1, BlockStatus.AVAILABLE),
        (14, 3, 3, datetime(2026, 9, 15, 15, 0), datetime(2026, 9, 15, 17, 30), 150, BlockType.COMBINED_BLOCK, 1, BlockStatus.AVAILABLE),
    ]

    block_objs = []
    for bid, cid, sid, st, et, dur, btype, traf, stat in block_windows_defs:
        bw = BlockWindow(
            block_id=bid,
            corridor_id=cid,
            section_id=sid,
            start_time=st,
            end_time=et,
            duration_minutes=dur,
            block_type=btype,
            traffic_level=traf,
            status=stat,
            eligible_departments="Engineering/Track,S&T/Signalling,Traction Distribution,Telecommunication"
        )
        db.add(bw)
        block_objs.append(bw)
    db.commit()

    # 11. Trains & Timetable Movements
    trains_spec = [
        (1, "12009", TrainType.EXPRESS, TrainPriority.HIGH, "Mumbai Ahmedabad Shatabdi"),
        (2, "22926", TrainType.EXPRESS, TrainPriority.CRITICAL, "Vande Bharat Express (ADI - BRC)"),
        (3, "12952", TrainType.EXPRESS, TrainPriority.HIGH, "Mumbai Rajdhani Express"),
        (4, "12001", TrainType.EXPRESS, TrainPriority.CRITICAL, "New Delhi Shatabdi Express"),
        (5, "12301", TrainType.EXPRESS, TrainPriority.CRITICAL, "Howrah Rajdhani Express"),
        (6, "12417", TrainType.PASSENGER, TrainPriority.MEDIUM, "Prayagraj Express"),
        (7, "BOXN-901", TrainType.FREIGHT, TrainPriority.LOW, "Coal Freight Train rake ASN-DHN"),
        (8, "CONT-77", TrainType.FREIGHT, TrainPriority.MEDIUM, "Container Depot Express UP"),
    ]

    train_objs = []
    for tid, num, ttype, prio, name in trains_spec:
        tr = Train(
            train_id=tid,
            train_number=num,
            train_type=ttype,
            priority=prio,
            max_speed=130 if ttype == TrainType.EXPRESS else 100,
            current_status="AVAILABLE",
            meta_data=json.dumps({"name": name})
        )
        db.add(tr)
        train_objs.append(tr)
    db.commit()

    # Train movements on Corridor 2 around the block windows
    # Note: 14:00 - 16:30 is clear of CRITICAL trains!
    # Train 12009 passes at 10:45 (making 10:30-12:00 have moderate traffic)
    # Train 22926 Vande Bharat passes at 17:15 (after the 14:00-16:30 block window)
    movements_data = [
        # Corridor 2, Section 2 (C2-02)
        (1, 1, 2, 2, datetime(2026, 9, 15, 10, 45), datetime(2026, 9, 15, 11, 10), 25, 0, "ON_TIME"),
        (2, 2, 2, 2, datetime(2026, 9, 15, 17, 15), datetime(2026, 9, 15, 17, 35), 20, 0, "ON_TIME"),
        (3, 3, 2, 2, datetime(2026, 9, 15, 20, 10), datetime(2026, 9, 15, 20, 30), 20, 0, "ON_TIME"),
        (4, 8, 2, 2, datetime(2026, 9, 15, 8, 15), datetime(2026, 9, 15, 8, 45), 30, 0, "ON_TIME"),
        # Corridor 1
        (5, 4, 1, 1, datetime(2026, 9, 15, 6, 15), datetime(2026, 9, 15, 6, 35), 20, 0, "ON_TIME"),
        (6, 5, 1, 2, datetime(2026, 9, 15, 16, 45), datetime(2026, 9, 15, 17, 5), 20, 0, "ON_TIME"),
        # Corridor 3
        (7, 7, 3, 1, datetime(2026, 9, 15, 7, 0), datetime(2026, 9, 15, 7, 40), 40, 0, "ON_TIME"),
    ]

    for mid, trid, cid, sid, arr, dep, dur, dly, stat in movements_data:
        tm = TrainMovement(
            movement_id=mid,
            train_id=trid,
            corridor_id=cid,
            section_id=sid,
            arrival_time=arr,
            departure_time=dep,
            scheduled_duration=dur,
            delay_minutes=dly,
            forecast_status=stat
        )
        db.add(tm)
    db.commit()

    # 12. Pre-Existing Active Approved Plan (for Field Inspector Demonstration)
    # Plan #101 on Corridor C2: Scheduled for Today 14:00 - 16:30
    approved_plan = MaintenancePlan(
        plan_id=101,
        plan_number="PLAN-2026-00101",
        version=1,
        corridor_id=2,
        section_id=2,
        maintenance_request_id=1001,
        plan_name="Coordinated Corridor C2 Daytime Possession Plan",
        plan_type=PlanType.DAILY,
        status=PlanStatus.APPROVED,
        horizon_start=datetime(2026, 9, 15, 14, 0),
        horizon_end=datetime(2026, 9, 15, 16, 30),
        corridor_ids="[2]",
        departments='["Engineering/Track", "S&T/Signalling", "Traction Distribution"]',
        total_score=94.5,
        asset_availability=97.2,
        train_impact_minutes=15,
        maintenance_completion_percent=100.0,
        block_utilization_percent=92.0,
        coordination_score=96.0,
        notes="Pre-approved coordinated maintenance possession for Section C2-02. Multi-crew safety protocol verified.",
        created_by=user_objs["MAINTENANCE_ENGINEER"].employee_id,
        submitted_by=user_objs["MAINTENANCE_ENGINEER"].full_name,
        approved_by=user_objs["OPERATIONS_MANAGER"].full_name,
        approved_at=datetime(2026, 9, 14, 18, 30)
    )
    db.add(approved_plan)
    db.flush()

    # Assignments for Plan 101:
    # Task 1001 (Track T-104), Task 1002 (Point S-220), Task 1003 (OHE TR-19)
    assigned_tasks = [
        (1001, 2, resource_objs[2].resource_id, "Replace damaged rail joint on Track T-104"),
        (1002, 2, resource_objs[3].resource_id, "Point machine lubrication and contact test"),
        (1003, 2, resource_objs[5].resource_id, "25kV cantilever insulator soot cleaning")
    ]

    execution_records = []
    for tid, bid, resid, notes in assigned_tasks:
        pa = PlanAssignment(
            plan_id=approved_plan.plan_id,
            task_id=tid,
            block_id=bid,
            resource_id=resid,
            assigned_start_time=datetime(2026, 9, 15, 14, 0),
            assigned_end_time=datetime(2026, 9, 15, 16, 30),
            status="ASSIGNED",
            efficiency_score=95.0,
            notes=notes
        )
        db.add(pa)
        db.flush()

        # Update task status to SCHEDULED and link current_plan_id
        t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == tid).first()
        if t:
            t.status = TaskStatus.SCHEDULED
            t.current_plan_id = approved_plan.plan_id

        # Create execution record for Inspector (Task 1001 is assigned to Inspector Manoj Tiwari)
        exec_rec = ExecutionRecord(
            assignment_id=pa.assignment_id,
            task_id=tid,
            inspector_id=user_objs["FIELD_INSPECTOR"].user_id,
            status=ExecutionStatus.NOT_STARTED
        )
        db.add(exec_rec)
        execution_records.append(exec_rec)

    # Seed 1 initial historical CriticalEvent
    seed_event = CriticalEvent(
        event_id=1,
        event_number="CE-2026-00001",
        type="CRITICAL_SIGNAL_FAILURE",
        asset_id=2,
        corridor_id=2,
        section_id=2,
        severity=9,
        description="Signal S-104 relay circuit intermittent drop during rain",
        reported_by="Inspector Manoj Tiwari",
        reported_at=datetime(2026, 9, 14, 16, 20),
        affected_plan_id=101,
        status="RESOLVED",
        replan_required=False,
        resolved_at=datetime(2026, 9, 14, 17, 30)
    )
    db.add(seed_event)
    db.commit()

    # Add approval audit log
    appr = PlanApproval(
        plan_id=approved_plan.plan_id,
        action="APPROVED",
        actor_user_id=user_objs["OPERATIONS_MANAGER"].user_id,
        actor_name=user_objs["OPERATIONS_MANAGER"].full_name,
        actor_role="OPERATIONS_MANAGER",
        comments="Approved for possession. Minimum train speed restriction applies on adjacent line."
    )
    db.add(appr)

    # Add initial notification for Inspector and Manager
    notif1 = Notification(
        user_id=user_objs["FIELD_INSPECTOR"].user_id,
        target_role="FIELD_INSPECTOR",
        title="Today's Maintenance Assignment Ready",
        message="You have 1 assigned block at Section C2-02 (Track T-104 Rail Replacement) scheduled for 14:00.",
        link="/execution",
        notification_type="INFO"
    )
    notif2 = Notification(
        user_id=user_objs["OPERATIONS_MANAGER"].user_id,
        target_role="OPERATIONS_MANAGER",
        title="Corridor C2 Plan Approved & Active",
        message="Maintenance Plan #101 scheduled for 14:00-16:30 today. 3 teams coordinated.",
        link="/plans/101",
        notification_type="APPROVAL"
    )
    db.add_all([notif1, notif2])
    db.commit()

    return {
        "roles": len(roles_def),
        "users": len(demo_users_data),
        "corridors": len(corridors_data),
        "sections": len(sections_list),
        "assets": len(asset_objs),
        "maintenance_tasks": len(task_objs),
        "block_windows": len(block_objs),
        "trains": len(train_objs),
        "train_movements": len(movements_data),
        "plans": 1,
        "execution_records": len(execution_records)
    }
