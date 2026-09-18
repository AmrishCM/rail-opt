export interface MockTrain {
  id: string
  trainNumber: string
  trainName: string
  trainType: 'VANDE_BHARAT' | 'SHATABDI' | 'EXPRESS' | 'FREIGHT' | 'PASSENGER'
  track: 'C1' | 'C2' | 'C3' | 'C4'
  trackName: string
  direction: 'UP' | 'DOWN'
  currentKm: number
  scheduledDeparture: string
  scheduledArrival: string
  startMinute: number // minute of day 0-1440
  durationMinutes: number
  speedKmh: number
  status: 'ON_TIME' | 'RUNNING' | 'DELAYED' | 'HALTED'
  delayMinutes: number
  route: string
  priority: 'HIGH' | 'CRITICAL' | 'NORMAL'
}

export interface MockMaintenanceBlock {
  id: string
  workOrderId: string
  title: string
  department: 'CIVIL_TRACK' | 'SIGNALLING' | 'TRACTION_OHE'
  track: 'C1' | 'C2' | 'C3' | 'C4'
  trackName: string
  startKm: number
  endKm: number
  startTime: string
  endTime: string
  startMinute: number
  durationMinutes: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'REPLAN_REQUESTED'
  speedRestrictionKmh?: number
  supervisor: string
  assignedGang: string
  machinery: string
  conflictTrainId?: string
}

export const MOCK_TRAINS: MockTrain[] = [
  {
    id: 'TR-12671',
    trainNumber: '12671',
    trainName: 'Nilagiri Superfast Express',
    trainType: 'EXPRESS',
    track: 'C1',
    trackName: 'Track C1 (Up Fast)',
    direction: 'UP',
    currentKm: 28.5,
    scheduledDeparture: '09:40',
    scheduledArrival: '10:35',
    startMinute: 580,
    durationMinutes: 55,
    speedKmh: 110,
    status: 'RUNNING',
    delayMinutes: 0,
    route: 'Chennai Central ➔ Mettupalayam',
    priority: 'HIGH'
  },
  {
    id: 'TR-12675',
    trainNumber: '12675',
    trainName: 'Kovai Express',
    trainType: 'EXPRESS',
    track: 'C1',
    trackName: 'Track C1 (Up Fast)',
    direction: 'UP',
    currentKm: 64.2,
    scheduledDeparture: '11:15',
    scheduledArrival: '12:10',
    startMinute: 675,
    durationMinutes: 55,
    speedKmh: 105,
    status: 'ON_TIME',
    delayMinutes: 0,
    route: 'Chennai Central ➔ Coimbatore Jn',
    priority: 'HIGH'
  },
  {
    id: 'TR-20643',
    trainNumber: '20643',
    trainName: 'Vande Bharat Express',
    trainType: 'VANDE_BHARAT',
    track: 'C2',
    trackName: 'Track C2 (Down Main)',
    direction: 'DOWN',
    currentKm: 42.5,
    scheduledDeparture: '13:40',
    scheduledArrival: '14:25',
    startMinute: 820,
    durationMinutes: 45,
    speedKmh: 130,
    status: 'RUNNING',
    delayMinutes: 4,
    route: 'Coimbatore Jn ➔ Chennai Central',
    priority: 'CRITICAL'
  },
  {
    id: 'TR-12009',
    trainNumber: '12009',
    trainName: 'Shatabdi Express',
    trainType: 'SHATABDI',
    track: 'C2',
    trackName: 'Track C2 (Down Main)',
    direction: 'DOWN',
    currentKm: 14.8,
    scheduledDeparture: '15:10',
    scheduledArrival: '15:58',
    startMinute: 910,
    durationMinutes: 48,
    speedKmh: 120,
    status: 'ON_TIME',
    delayMinutes: 0,
    route: 'Bengaluru City ➔ Chennai',
    priority: 'HIGH'
  },
  {
    id: 'TR-16525',
    trainNumber: '16525',
    trainName: 'Island Express',
    trainType: 'EXPRESS',
    track: 'C2',
    trackName: 'Track C2 (Down Main)',
    direction: 'DOWN',
    currentKm: 81.0,
    scheduledDeparture: '17:40',
    scheduledArrival: '18:40',
    startMinute: 1060,
    durationMinutes: 60,
    speedKmh: 90,
    status: 'ON_TIME',
    delayMinutes: 0,
    route: 'Kanyakumari ➔ Bengaluru City',
    priority: 'NORMAL'
  },
  {
    id: 'TR-GOODS-4102',
    trainNumber: 'BTPN-4102',
    trainName: 'Container Freight Rake',
    trainType: 'FREIGHT',
    track: 'C3',
    trackName: 'Track C3 (Goods Loop)',
    direction: 'UP',
    currentKm: 51.3,
    scheduledDeparture: '12:00',
    scheduledArrival: '14:30',
    startMinute: 720,
    durationMinutes: 150,
    speedKmh: 65,
    status: 'RUNNING',
    delayMinutes: 12,
    route: 'Irugur Goods Yard ➔ Tondiarpet',
    priority: 'NORMAL'
  },
  {
    id: 'TR-GOODS-8821',
    trainNumber: 'BOXN-8821',
    trainName: 'Thermal Coal Hopper Rake',
    trainType: 'FREIGHT',
    track: 'C3',
    trackName: 'Track C3 (Goods Loop)',
    direction: 'DOWN',
    currentKm: 88.0,
    scheduledDeparture: '15:30',
    scheduledArrival: '18:00',
    startMinute: 930,
    durationMinutes: 150,
    speedKmh: 50,
    status: 'ON_TIME',
    delayMinutes: 0,
    route: 'Ennore Port ➔ Mettur Thermal Plant',
    priority: 'NORMAL'
  },
  {
    id: 'TR-56713',
    trainNumber: '56713',
    trainName: 'Salem–Erode Passenger Shuttle',
    trainType: 'PASSENGER',
    track: 'C4',
    trackName: 'Track C4 (Loop / Siding)',
    direction: 'UP',
    currentKm: 19.8,
    scheduledDeparture: '10:05',
    scheduledArrival: '11:15',
    startMinute: 605,
    durationMinutes: 70,
    speedKmh: 55,
    status: 'ON_TIME',
    delayMinutes: 0,
    route: 'Salem Jn ➔ Erode Jn',
    priority: 'NORMAL'
  }
]

export const MOCK_MAINTENANCE_BLOCKS: MockMaintenanceBlock[] = [
  {
    id: 'BLK-C2-01',
    workOrderId: 'WO-2026-0811',
    title: 'Emergency Rail Fracture Thermit Welding',
    department: 'CIVIL_TRACK',
    track: 'C2',
    trackName: 'Track C2 (Down Main)',
    startKm: 41.5,
    endKm: 44.5,
    startTime: '14:00',
    endTime: '16:30',
    startMinute: 840,
    durationMinutes: 150,
    status: 'IN_PROGRESS',
    speedRestrictionKmh: 30,
    supervisor: 'SSE/P-Way Salem (K. Murugan)',
    assignedGang: 'Gang 04 (Thermit Mobile Unit)',
    machinery: 'AFT Tamper 09-3X + Flash-Butt Rig',
    conflictTrainId: 'TR-20643'
  },
  {
    id: 'BLK-C1-02',
    workOrderId: 'WO-2026-0798',
    title: 'Point Machine PM-042 Switch Calibration',
    department: 'SIGNALLING',
    track: 'C1',
    trackName: 'Track C1 (Up Fast)',
    startKm: 18.0,
    endKm: 19.5,
    startTime: '10:30',
    endTime: '12:00',
    startMinute: 630,
    durationMinutes: 90,
    status: 'COMPLETED',
    speedRestrictionKmh: 50,
    supervisor: 'JE/Signal Sankari (S. Ramesh)',
    assignedGang: 'S&T Fast Response Squad 02',
    machinery: 'Digital Impedance Analyzer + Multimeter'
  },
  {
    id: 'BLK-C2-03',
    workOrderId: 'WO-2026-0820',
    title: '25kV OHE Cantilever Insulator Replacement',
    department: 'TRACTION_OHE',
    track: 'C2',
    trackName: 'Track C2 (Down Main)',
    startKm: 56.0,
    endKm: 61.0,
    startTime: '16:45',
    endTime: '18:30',
    startMinute: 1005,
    durationMinutes: 105,
    status: 'SCHEDULED',
    speedRestrictionKmh: 45,
    supervisor: 'DEE/TRD Erode (P. Venkat)',
    assignedGang: 'Tower Wagon Gang E-01',
    machinery: '4-Wheeled 25kV Inspection Tower Car'
  },
  {
    id: 'BLK-C3-04',
    workOrderId: 'WO-2026-0825',
    title: 'Ultrasonic Flaw Detection (USFD) Systematic Run',
    department: 'CIVIL_TRACK',
    track: 'C3',
    trackName: 'Track C3 (Goods Loop)',
    startKm: 70.0,
    endKm: 85.0,
    startTime: '13:00',
    endTime: '15:15',
    startMinute: 780,
    durationMinutes: 135,
    status: 'SCHEDULED',
    speedRestrictionKmh: 20,
    supervisor: 'SE/USFD Div (A. Thomas)',
    assignedGang: 'USFD Testing Unit 03',
    machinery: 'Single-Rail Digital Ultrasonic Trolley'
  }
]
