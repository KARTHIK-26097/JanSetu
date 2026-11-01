import type {
  Message,
  Report,
  ReportStatus,
  UrgencyLevel,
} from '../types';
import { analyzeGrievance, MUNICIPAL_AUTHORITIES } from './triageEngine';

const STORAGE_KEY = 'civicvoice_reports_v2';
const LISTENERS: Array<() => void> = [];

export function subscribeToReports(listener: () => void) {
  LISTENERS.push(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorage);
  return () => {
    const idx = LISTENERS.indexOf(listener);
    if (idx > -1) LISTENERS.splice(idx, 1);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorage);
  };
}

function notifyListeners() {
  LISTENERS.forEach((l) => l());
}

/**
 * Realistic Initial Demo Seed Data for Civic Voice
 */
const INITIAL_DEMO_REPORTS: Report[] = [
  {
    id: 'CV-2026-8941',
    title: 'High-Pressure Water Main Rupture Flooding Fulton St',
    originalDescription:
      'Ruptura de tubería principal de agua inundando la acera peatonal e ingresando a locales comerciales subterráneos.',
    originalLanguage: 'es',
    translatedDescription:
      'Water main rupture flooding the pedestrian sidewalk and flowing into basement storefronts.',
    transcriptText:
      'Ruptura de tubería principal de agua inundando la acera peatonal e ingresando a locales comerciales subterráneos.',
    hasVoiceRecording: true,
    category: 'water',
    categoryConfirmed: true,
    severity: 'critical',
    severityOverridden: false,
    status: 'in_progress',
    location: {
      address: '412 Fulton Street, Downtown Civic Core',
      lat: 40.6928,
      lng: -73.9872,
      zone: 'Downtown',
      landmark: 'Near City Center Cafe & Fulton Metro Entrance',
    },
    attachments: [
      {
        id: 'att-1',
        name: 'water_main_eruption.jpg',
        url: '/demo-images/water-leak.jpg',
        sizeBytes: 1164797,
        type: 'image/jpeg',
      },
    ],
    citizenId: 'cit-9021',
    citizenName: 'Elena Rostova',
    citizenPhoneCountryCode: '+1',
    citizenPhone: '555-019-2831',
    citizenEmail: 'elena.rostova@example.org',
    assignedAuthorityId: 'auth-water',
    assignedAuthorityName: 'Municipal Water & Sewerage Authority',
    assignedOfficer: 'Lead Engineer Marcos Vance (Unit 4)',
    triage: {
      immediateDangerScore: 88,
      riskToPeople:
        'Acute slip hazard, structural wash under sidewalk slabs, and risk of localized basement inundation.',
      scaleDisruption:
        'Water pressure dropped in 3 commercial blocks; street gutter capacity exceeded.',
      worseningRate:
        'High water flow volume eroding road foundation rapidly.',
      suggestedSeverity: 'critical',
      suggestedCategory: 'water',
      suggestedAuthorityId: 'auth-water',
      suggestedAuthorityName: 'Municipal Water & Sewerage Authority',
      safetyGuidance:
        'Informational Safety Notice: Do not attempt to wade through standing murky water. Avoid consuming tap water until municipal quality is verified.',
      reasonFactors: [
        'Critical safety triggers detected: "burst pipe", "severe flooding".',
        'High-density traffic corridor with heightened exposure volume.',
      ],
    },
    createdAt: '2026-10-31T08:15:00Z',
    updatedAt: '2026-10-31T10:30:00Z',
    slaHours: 4,
    isOverdue: false,
    statusHistory: [
      {
        id: 'hist-1',
        status: 'submitted',
        timestamp: '2026-10-31T08:15:00Z',
        updatedBy: 'Citizen (Voice Portal)',
        role: 'citizen',
        comment: 'Report submitted via Mobile Speech Dictation in Spanish.',
      },
      {
        id: 'hist-2',
        status: 'triaged',
        timestamp: '2026-10-31T08:17:00Z',
        updatedBy: 'Civic Voice AI Engine',
        role: 'system',
        comment:
          'Automated explainable triage: Severity evaluated as CRITICAL (Score: 88/100). Auto-routed to MWSA.',
      },
      {
        id: 'hist-3',
        status: 'assigned',
        timestamp: '2026-10-31T08:35:00Z',
        updatedBy: 'Chief Dispatcher Sarah Chen',
        role: 'handler',
        comment: 'Dispatched Hydraulics Emergency Crew #4 under Lead Engineer Vance.',
      },
      {
        id: 'hist-4',
        status: 'in_progress',
        timestamp: '2026-10-31T09:10:00Z',
        updatedBy: 'Officer Marcos Vance',
        role: 'handler',
        comment: 'Emergency isolation valves located and shut-off initiated.',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        reportId: 'CV-2026-8941',
        senderId: 'auth-water',
        senderName: 'MWSA Rapid Response',
        senderRole: 'handler',
        content:
          'Emergency crew is on site at Fulton St. Main isolation valve has been clamped. Excavation repair team en route.',
        timestamp: '2026-10-31T09:15:00Z',
        isInternal: false,
        type: 'status_change',
      },
      {
        id: 'msg-internal-1',
        reportId: 'CV-2026-8941',
        senderId: 'officer-vance',
        senderName: 'Lead Engineer Vance',
        senderRole: 'handler',
        content:
          'INTERNAL NOTE: Sub-base cavity detected beneath curb. Need DOT geotechnical inspector to sign off on backfill before repaving asphalt.',
        timestamp: '2026-10-31T09:40:00Z',
        isInternal: true,
        type: 'chat',
      },
      {
        id: 'msg-2',
        reportId: 'CV-2026-8941',
        senderId: 'cit-9021',
        senderName: 'Elena Rostova',
        senderRole: 'citizen',
        content: 'Thank you for the quick arrival! The water flow has stopped overflowing our stoop.',
        timestamp: '2026-10-31T09:55:00Z',
        isInternal: false,
        type: 'chat',
      },
    ],
    reopenedCount: 0,
  },
  {
    id: 'CV-2026-8924',
    title: 'Severely Damaged Street Light Pole with Dangling Live Wires',
    originalDescription:
      'टक्कर के बाद बिजली का खंभा खतरनाक रूप से झुक गया है और खुले बिजली के तार लटक रहे हैं।',
    originalLanguage: 'hi',
    translatedDescription:
      'Street lighting pole tilted dangerously with exposed live electrical wires after a collision.',
    transcriptText:
      'टक्कर के बाद बिजली का खंभा खतरनाक रूप से झुक गया है और खुले बिजली के तार लटक रहे हैं।',
    hasVoiceRecording: true,
    category: 'street_lighting',
    categoryConfirmed: true,
    severity: 'critical',
    severityOverridden: false,
    status: 'triaged',
    location: {
      address: '782 Avenue St. Martin, Eastside District',
      lat: 40.7182,
      lng: -73.9542,
      zone: 'Eastside',
      landmark: 'Opposite Central Utilities Substation',
    },
    attachments: [
      {
        id: 'att-2',
        name: 'tilted_light_pole.jpg',
        url: '/demo-images/street-light.jpg',
        sizeBytes: 856069,
        type: 'image/jpeg',
      },
    ],
    citizenId: 'cit-8104',
    citizenName: 'Aarav Sharma',
    citizenPhoneCountryCode: '+91',
    citizenPhone: '98201-44912',
    citizenEmail: 'aarav.sharma@example.com',
    assignedAuthorityId: 'auth-power',
    assignedAuthorityName: 'Bureau of Street Lighting & Grid Safety',
    assignedOfficer: 'Field Tech David Thorne',
    triage: {
      immediateDangerScore: 92,
      riskToPeople:
        'Direct electrocution hazard and imminent mechanical collapse across active vehicle lane.',
      scaleDisruption:
        'Bus route obstructed; 4 adjacent streetlamps offline causing dusk darkness.',
      worseningRate:
        'High wind speeds increasing pole oscillation stress on fractured concrete base.',
      suggestedSeverity: 'critical',
      suggestedCategory: 'street_lighting',
      suggestedAuthorityId: 'auth-power',
      suggestedAuthorityName: 'Bureau of Street Lighting & Grid Safety',
      safetyGuidance:
        'Informational Safety Notice: Keep a minimum 10-meter clearance from tilted poles or fallen wiring. Treat all exposed wires as live.',
      reasonFactors: [
        'Critical safety triggers detected: "electric", "live wire", "tilted pole".',
        'Pedestrian thoroughfare exposure during evening rush hour.',
      ],
    },
    createdAt: '2026-10-31T09:40:00Z',
    updatedAt: '2026-10-31T10:05:00Z',
    slaHours: 4,
    isOverdue: false,
    statusHistory: [
      {
        id: 'hist-201',
        status: 'submitted',
        timestamp: '2026-10-31T09:40:00Z',
        updatedBy: 'Citizen (Voice Portal)',
        role: 'citizen',
        comment: 'Report submitted in Hindi via Mobile Portal with photo upload.',
      },
      {
        id: 'hist-202',
        status: 'triaged',
        timestamp: '2026-10-31T09:42:00Z',
        updatedBy: 'Civic Voice AI Engine',
        role: 'system',
        comment:
          'Explainable triage: Severity CRITICAL (Score: 92/100). Live wire danger flag triggered.',
      },
    ],
    messages: [
      {
        id: 'msg-h2',
        reportId: 'CV-2026-8924',
        senderId: 'auth-power',
        senderName: 'Grid Control Center',
        senderRole: 'handler',
        content:
          'Grid operators have been notified to de-energize segment St-Martin-4B remotely. Please maintain a safe distance.',
        timestamp: '2026-10-31T10:00:00Z',
        isInternal: false,
        type: 'info_request',
      },
      {
        id: 'msg-internal-2',
        reportId: 'CV-2026-8924',
        senderId: 'coord-lee',
        senderName: 'Dispatcher Clara Lee',
        senderRole: 'handler',
        content:
          'INTERNAL NOTE: Bucket truck #12 is finishing wire repair on 12th St. ETA to Avenue St. Martin is 25 minutes.',
        timestamp: '2026-10-31T10:05:00Z',
        isInternal: true,
        type: 'chat',
      },
    ],
    reopenedCount: 0,
  },
  {
    id: 'CV-2026-8902',
    title: 'Deep Hazardous Pothole on 4th Avenue Northbound',
    originalDescription:
      'Massive deep pothole on the northbound lane causing severe wheel damage and swerving.',
    originalLanguage: 'en',
    translatedDescription:
      'Massive deep pothole on the northbound lane causing severe wheel damage and swerving.',
    transcriptText:
      'Massive deep pothole on the northbound lane causing severe wheel damage and swerving.',
    hasVoiceRecording: false,
    category: 'roads',
    categoryConfirmed: true,
    severity: 'high',
    severityOverridden: false,
    status: 'resolved',
    location: {
      address: '1540 4th Avenue, City Center',
      lat: 40.7589,
      lng: -73.9851,
      zone: 'Downtown',
      landmark: 'In front of Metro Bank & Cafe Plaza',
    },
    attachments: [
      {
        id: 'att-3',
        name: 'road_pothole_asphalt.jpg',
        url: '/demo-images/pothole.jpg',
        sizeBytes: 1088949,
        type: 'image/jpeg',
      },
    ],
    citizenId: 'cit-7391',
    citizenName: 'Jordan Taylor',
    citizenPhoneCountryCode: '+1',
    citizenPhone: '555-839-1102',
    citizenEmail: 'jordan.t@example.com',
    assignedAuthorityId: 'auth-dot',
    assignedAuthorityName: 'Department of Transportation & Public Works',
    assignedOfficer: 'Supervisor Ramon Cruz',
    triage: {
      immediateDangerScore: 68,
      riskToPeople:
        'High vehicular damage hazard, tire blowouts, and sudden lane-swerving risk.',
      scaleDisruption: 'Reduced capacity on major northbound arterial transit lane.',
      worseningRate: 'Edge degradation continuing under heavy bus traffic load.',
      suggestedSeverity: 'high',
      suggestedCategory: 'roads',
      suggestedAuthorityId: 'auth-dot',
      suggestedAuthorityName: 'Department of Transportation & Public Works',
      safetyGuidance:
        'Informational Safety Notice: Motorists should reduce speed and proceed with caution. Cyclists should dismount when approaching damaged asphalt.',
      reasonFactors: [
        'Elevated hazard factors: "deep pothole", "wheel damage", "swerving".',
        'High-density traffic corridor with heightened exposure volume.',
      ],
    },
    createdAt: '2026-10-30T14:20:00Z',
    updatedAt: '2026-10-31T07:45:00Z',
    slaHours: 24,
    isOverdue: false,
    statusHistory: [
      {
        id: 'hist-301',
        status: 'submitted',
        timestamp: '2026-10-30T14:20:00Z',
        updatedBy: 'Citizen',
        role: 'citizen',
        comment: 'Report submitted via Form Mode with photo.',
      },
      {
        id: 'hist-302',
        status: 'triaged',
        timestamp: '2026-10-30T14:25:00Z',
        updatedBy: 'Civic Voice AI Engine',
        role: 'system',
        comment: 'Explainable triage: Severity HIGH (Score: 68/100). Routed to DOT-PW.',
      },
      {
        id: 'hist-303',
        status: 'assigned',
        timestamp: '2026-10-30T15:00:00Z',
        updatedBy: 'DOT Operations Dispatch',
        role: 'handler',
        comment: 'Assigned to Asphalt Mobile Patch Crew 2.',
      },
      {
        id: 'hist-304',
        status: 'in_progress',
        timestamp: '2026-10-30T22:30:00Z',
        updatedBy: 'Supervisor Ramon Cruz',
        role: 'handler',
        comment: 'Night repair window scheduled: Cold plane and hot asphalt compaction.',
      },
      {
        id: 'hist-305',
        status: 'resolved',
        timestamp: '2026-10-31T07:45:00Z',
        updatedBy: 'Supervisor Ramon Cruz',
        role: 'handler',
        comment: 'Asphalt cold milled, filled with high-grade hot mix asphalt and roller compacted.',
      },
    ],
    messages: [
      {
        id: 'msg-dot-1',
        reportId: 'CV-2026-8902',
        senderId: 'auth-dot',
        senderName: 'DOT Public Works Dispatch',
        senderRole: 'handler',
        content:
          'Pothole repair scheduled for overnight off-peak hours to avoid daytime traffic disruptions.',
        timestamp: '2026-10-30T16:10:00Z',
        isInternal: false,
        type: 'chat',
      },
      {
        id: 'msg-dot-2',
        reportId: 'CV-2026-8902',
        senderId: 'auth-dot',
        senderName: 'Supervisor Ramon Cruz',
        senderRole: 'handler',
        content:
          'Repair complete. Lane reopened to normal traffic flow. Thank you for reporting this issue to keep our streets safe.',
        timestamp: '2026-10-31T07:45:00Z',
        isInternal: false,
        type: 'resolution',
      },
    ],
    resolution: {
      resolvedAt: '2026-10-31T07:45:00Z',
      resolvedBy: 'Supervisor Ramon Cruz',
      handlerTitle: 'Senior Asphalt Maintenance Lead, DOT',
      summary:
        'Excavated damaged road sub-base, laid 4 inches of dense-graded hot mix asphalt, and compacted with 5-ton vibratory roller.',
      actionTaken: 'Full asphalt sub-surface patch and traffic-grade thermoplastic line touch-up.',
      closureNotes: 'Quality inspection passed. Surface smooth and flush with road deck.',
      equipmentUsed: 'Pavement saw, asphalt hotbox, vibratory roller.',
    },
    feedback: {
      rating: 5,
      satisfaction: 'very_satisfied',
      comment:
        'Repaired within 18 hours! Extremely impressed by the speed and transparent status updates.',
      submittedAt: '2026-10-31T09:10:00Z',
    },
    reopenedCount: 0,
  },
  {
    id: 'CV-2026-8889',
    title: 'Severe Commercial Waste Accumulation in Alleyway',
    originalDescription:
      'Severe accumulation of rotting garbage and commercial waste blocking pedestrian emergency alleyway.',
    originalLanguage: 'en',
    translatedDescription:
      'Severe accumulation of rotting garbage and commercial waste blocking pedestrian emergency alleyway.',
    transcriptText:
      'Severe accumulation of rotting garbage and commercial waste blocking pedestrian emergency alleyway.',
    hasVoiceRecording: false,
    category: 'waste',
    categoryConfirmed: true,
    severity: 'medium',
    severityOverridden: false,
    status: 'submitted',
    location: {
      address: '229 Market Alley, South Harbor District',
      lat: 40.6712,
      lng: -74.0021,
      zone: 'South Harbor',
      landmark: 'Behind Fish Market Wharf',
    },
    attachments: [
      {
        id: 'att-4',
        name: 'overflowing_dumpsters.jpg',
        url: '/demo-images/waste-dump.jpg',
        sizeBytes: 1178077,
        type: 'image/jpeg',
      },
    ],
    citizenId: 'cit-6640',
    citizenName: 'Maya Lin',
    citizenPhoneCountryCode: '+1',
    citizenPhone: '555-712-9904',
    citizenEmail: 'maya.lin@example.org',
    assignedAuthorityId: 'auth-sanitation',
    assignedAuthorityName: 'Environmental Sanitation & Waste Division',
    triage: {
      immediateDangerScore: 42,
      riskToPeople: 'Odor, pest vector attraction, and partial pedestrian route obstruction.',
      scaleDisruption: 'Restricted alley access for commercial delivery carts.',
      worseningRate: 'Garbage accumulation expanding daily without scheduled collection.',
      suggestedSeverity: 'medium',
      suggestedCategory: 'waste',
      suggestedAuthorityId: 'auth-sanitation',
      suggestedAuthorityName: 'Environmental Sanitation & Waste Division',
      safetyGuidance:
        'Informational Safety Notice: Avoid direct physical contact with uncontained waste. Keep pets and children away from decomposing refuse.',
      reasonFactors: [
        'Solid waste hygiene threshold exceeded.',
        'Emergency egress alleyway partially obstructed.',
      ],
    },
    createdAt: '2026-10-31T11:00:00Z',
    updatedAt: '2026-10-31T11:00:00Z',
    slaHours: 72,
    isOverdue: false,
    statusHistory: [
      {
        id: 'hist-401',
        status: 'submitted',
        timestamp: '2026-10-31T11:00:00Z',
        updatedBy: 'Citizen',
        role: 'citizen',
        comment: 'Report submitted via Web Portal.',
      },
    ],
    messages: [],
    reopenedCount: 0,
  },
  {
    id: 'CV-2026-8860',
    title: 'Other Issue: Hazardous Unsecured Scaffolding Above School Walkway',
    originalDescription:
      'Temporary construction scaffolding over the elementary school footpath has loose metal clamps that swing in high wind. Poses grave falling object hazard for children.',
    originalLanguage: 'en',
    translatedDescription:
      'Temporary construction scaffolding over the elementary school footpath has loose metal clamps that swing in high wind. Poses grave falling object hazard for children.',
    hasVoiceRecording: false,
    category: 'other',
    categoryConfirmed: true,
    customCategoryDescription: 'Unsecured Construction Scaffolding & Sidewalk Shed Hazard',
    severity: 'high',
    severityOverridden: false,
    status: 'assigned',
    location: {
      address: '88 Oakwood Lane, North River District',
      lat: 40.7391,
      lng: -73.9711,
      zone: 'North River',
      landmark: 'Beside North River Elementary School Gates',
    },
    attachments: [],
    citizenId: 'cit-3319',
    citizenName: 'Beatrice Gomez',
    citizenPhoneCountryCode: '+1',
    citizenPhone: '555-401-7782',
    citizenEmail: 'bgomez@parentscouncil.org',
    assignedAuthorityId: 'auth-dot',
    assignedAuthorityName: 'Department of Transportation & Public Works',
    assignedOfficer: 'Building Safety Inspector Harris',
    triage: {
      immediateDangerScore: 74,
      riskToPeople: 'Head injury or crush risk to schoolchildren and morning pedestrians.',
      scaleDisruption: 'Primary school pedestrian path partially restricted.',
      worseningRate: 'Forecasted wind gusts expected to loosen unsecured aluminum crossbars.',
      suggestedSeverity: 'high',
      suggestedCategory: 'other',
      suggestedAuthorityId: 'auth-dot',
      suggestedAuthorityName: 'Department of Transportation & Public Works',
      safetyGuidance:
        'Informational Safety Notice: Pedestrians are advised to cross to the opposite sidewalk until scaffolding reinforcement is confirmed.',
      reasonFactors: [
        'Proximity to vulnerable populations (school / medical facility zone).',
        'Falling structural debris risk identified.',
      ],
    },
    createdAt: '2026-10-31T06:30:00Z',
    updatedAt: '2026-10-31T08:00:00Z',
    slaHours: 24,
    isOverdue: false,
    statusHistory: [
      {
        id: 'hist-601',
        status: 'submitted',
        timestamp: '2026-10-31T06:30:00Z',
        updatedBy: 'Citizen',
        role: 'citizen',
        comment: 'Report submitted under custom "Other Issue" category.',
      },
      {
        id: 'hist-602',
        status: 'assigned',
        timestamp: '2026-10-31T08:00:00Z',
        updatedBy: 'Safety Dispatch',
        role: 'handler',
        comment: 'Assigned to Municipal Building Safety Inspector Harris.',
      },
    ],
    messages: [
      {
        id: 'msg-scaff-1',
        reportId: 'CV-2026-8860',
        senderId: 'auth-dot',
        senderName: 'Safety Inspector Harris',
        senderRole: 'handler',
        content: 'Contractor has been served an immediate stop-work order until safety netting and anchor pins are bolted.',
        timestamp: '2026-10-31T08:05:00Z',
        isInternal: false,
        type: 'chat',
      },
    ],
    reopenedCount: 0,
  },
];

/**
 * Storage Engine
 */
export function getReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REPORTS));
      return INITIAL_DEMO_REPORTS;
    }
    const reports: Report[] = JSON.parse(raw);
    return reports;
  } catch (e) {
    console.error('Failed to load reports from storage, using memory', e);
    return INITIAL_DEMO_REPORTS;
  }
}

export function saveReports(reports: Report[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    notifyListeners();
  } catch (e) {
    console.error('Failed to save reports', e);
  }
}

export function getReportById(id: string): Report | undefined {
  const reports = getReports();
  return reports.find((r) => r.id === id);
}

export function createReport(data: {
  title?: string;
  originalDescription: string;
  originalLanguage: string;
  spokenLanguage?: string;
  translatedDescription?: string;
  transcriptText?: string;
  hasVoiceRecording?: boolean;
  audioAttachmentUrl?: string;
  category: any;
  customCategoryDescription?: string;
  location: any;
  attachments: any[];
  citizenName: string;
  citizenContact?: string;
  citizenPhone: string;
  citizenPhoneCountryCode: string;
  citizenEmail?: string;
}): Report {
  const reports = getReports();
  const nextNumber = Math.floor(1000 + Math.random() * 9000);
  const id = `CV-2026-${nextNumber}`;

  const triage = analyzeGrievance(
    data.originalDescription,
    data.category,
    data.location?.address
  );

  let slaHours = 72;
  if (triage.suggestedSeverity === 'critical') slaHours = 4;
  else if (triage.suggestedSeverity === 'high') slaHours = 24;
  else if (triage.suggestedSeverity === 'low') slaHours = 168;

  const now = new Date().toISOString();

  const titlePrefix =
    data.category === 'other' && data.customCategoryDescription
      ? `OTHER (${data.customCategoryDescription})`
      : data.category.toUpperCase();

  const newReport: Report = {
    id,
    title:
      data.title ||
      `${titlePrefix}: ${data.originalDescription.slice(0, 42)}...`,
    originalDescription: data.originalDescription,
    originalLanguage: data.originalLanguage || 'en',
    spokenLanguage: data.spokenLanguage || data.originalLanguage || 'en',
    translatedDescription: data.translatedDescription || data.originalDescription,
    transcriptText: data.transcriptText,
    hasVoiceRecording: data.hasVoiceRecording || false,
    audioAttachmentUrl: data.audioAttachmentUrl,
    category: data.category || triage.suggestedCategory,
    categoryConfirmed: !!data.category,
    customCategoryDescription: data.customCategoryDescription,
    severity: triage.suggestedSeverity,
    severityOverridden: false,
    status: 'submitted',
    location: data.location || {
      address: 'Downtown Metro Area',
      lat: 40.7128,
      lng: -74.006,
      zone: 'Downtown',
    },
    attachments: data.attachments || [],
    citizenId: `cit-${Math.floor(1000 + Math.random() * 9000)}`,
    citizenName: data.citizenName || 'Civic Voice Contributor',
    citizenPhoneCountryCode: data.citizenPhoneCountryCode || '+1',
    citizenPhone: data.citizenPhone || '',
    citizenEmail: data.citizenEmail,
    assignedAuthorityId: triage.suggestedAuthorityId,
    assignedAuthorityName: triage.suggestedAuthorityName,
    triage,
    createdAt: now,
    updatedAt: now,
    slaHours,
    isOverdue: false,
    statusHistory: [
      {
        id: `hist-${Date.now()}-1`,
        status: 'submitted',
        timestamp: now,
        updatedBy: data.citizenName || 'Citizen',
        role: 'citizen',
        comment: data.hasVoiceRecording
          ? 'Grievance submitted via Talk Mode with speech transcription.'
          : 'Grievance submitted via Civic Voice Portal.',
      },
      {
        id: `hist-${Date.now()}-2`,
        status: 'triaged',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        updatedBy: 'Civic Voice AI Triage Engine',
        role: 'system',
        comment: `Automated triage: Category identified as "${triage.suggestedCategory}". Severity assessed as ${triage.suggestedSeverity.toUpperCase()} (Danger Score: ${triage.immediateDangerScore}/100). Routed to ${triage.suggestedAuthorityName}.`,
      },
    ],
    messages: [
      {
        id: `msg-${Date.now()}`,
        reportId: id,
        senderId: 'system',
        senderName: 'Civic Voice Triage Desk',
        senderRole: 'system',
        content: `Your report has been logged under reference ${id}. Our system has routed this matter to the ${triage.suggestedAuthorityName}. Expected initial response within ${slaHours} hours. Updates will be sent to ${data.citizenPhoneCountryCode} ${data.citizenPhone}.`,
        timestamp: now,
        isInternal: false,
        type: 'chat',
      },
    ],
    reopenedCount: 0,
  };

  reports.unshift(newReport);
  saveReports(reports);
  return newReport;
}

export function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  actor: string,
  role: 'citizen' | 'handler' | 'admin',
  comment?: string
): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();
  report.status = newStatus;
  report.updatedAt = now;

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: newStatus,
    timestamp: now,
    updatedBy: actor,
    role,
    comment: comment || `Status transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`,
  });

  saveReports(reports);
  return report;
}

export function updateReportSeverity(
  reportId: string,
  newSeverity: UrgencyLevel,
  reason: string,
  actor: string
): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const oldSev = report.severity;
  report.severity = newSeverity;
  report.severityOverridden = true;
  report.severityOverrideReason = reason;
  report.updatedAt = new Date().toISOString();

  // Recalculate SLA
  if (newSeverity === 'critical') report.slaHours = 4;
  else if (newSeverity === 'high') report.slaHours = 24;
  else if (newSeverity === 'medium') report.slaHours = 72;
  else report.slaHours = 168;

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: report.status,
    timestamp: new Date().toISOString(),
    updatedBy: actor,
    role: 'handler',
    comment: `Handler overridden urgency: ${oldSev.toUpperCase()} → ${newSeverity.toUpperCase()}. Reason: "${reason}"`,
  });

  saveReports(reports);
  return report;
}

export function assignReport(
  reportId: string,
  authorityId: string,
  officerName: string,
  actor: string
): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const authority = MUNICIPAL_AUTHORITIES.find((a) => a.id === authorityId);
  report.assignedAuthorityId = authorityId;
  report.assignedAuthorityName = authority ? authority.name : authorityId;
  report.assignedOfficer = officerName || 'Duty Dispatch Team';
  report.updatedAt = new Date().toISOString();

  if (report.status === 'submitted' || report.status === 'triaged') {
    report.status = 'assigned';
  }

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: report.status,
    timestamp: new Date().toISOString(),
    updatedBy: actor,
    role: 'handler',
    comment: `Assigned to ${report.assignedAuthorityName} (Officer: ${report.assignedOfficer})`,
  });

  saveReports(reports);
  return report;
}

export function addMessageToReport(
  reportId: string,
  msg: {
    senderId: string;
    senderName: string;
    senderRole: 'citizen' | 'handler' | 'system' | 'admin';
    content: string;
    isInternal: boolean;
    type?: 'chat' | 'status_change' | 'info_request' | 'resolution';
  }
): Message {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const message: Message = {
    id: `msg-${Date.now()}`,
    reportId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    content: msg.content,
    timestamp: new Date().toISOString(),
    isInternal: msg.isInternal,
    type: msg.type || 'chat',
  };

  report.messages.push(message);
  report.updatedAt = message.timestamp;
  saveReports(reports);
  return message;
}

export function resolveReport(
  reportId: string,
  resolution: {
    resolvedBy: string;
    handlerTitle: string;
    summary: string;
    actionTaken: string;
    closureNotes?: string;
    equipmentUsed?: string;
  }
): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();
  report.status = 'resolved';
  report.updatedAt = now;
  report.resolution = {
    ...resolution,
    resolvedAt: now,
  };

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: 'resolved',
    timestamp: now,
    updatedBy: resolution.resolvedBy,
    role: 'handler',
    comment: `Report resolved: "${resolution.summary}". Action: ${resolution.actionTaken}`,
  });

  // Automatically broadcast citizen-facing resolution message
  report.messages.push({
    id: `msg-${Date.now()}`,
    reportId,
    senderId: 'handler',
    senderName: resolution.resolvedBy,
    senderRole: 'handler',
    content: `RESOLVED: ${resolution.summary}. Action taken: ${resolution.actionTaken}. If you find any issues remain, you can provide feedback or reopen the issue below.`,
    timestamp: now,
    isInternal: false,
    type: 'resolution',
  });

  saveReports(reports);
  return report;
}

export function submitFeedback(
  reportId: string,
  feedback: {
    rating: number;
    satisfaction: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied';
    comment?: string;
  }
): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();
  report.feedback = {
    ...feedback,
    submittedAt: now,
  };
  report.updatedAt = now;

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: report.status,
    timestamp: now,
    updatedBy: report.citizenName,
    role: 'citizen',
    comment: `Citizen provided resolution feedback: ${feedback.rating} / 5 Stars (${feedback.satisfaction.replace('_', ' ')})`,
  });

  saveReports(reports);
  return report;
}

export function reopenReport(reportId: string, reason: string, actor: string): Report {
  const reports = getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const now = new Date().toISOString();
  report.status = 'in_progress';
  report.reopenedCount = (report.reopenedCount || 0) + 1;
  report.reopenReason = reason;
  report.updatedAt = now;

  report.statusHistory.push({
    id: `hist-${Date.now()}`,
    status: 'in_progress',
    timestamp: now,
    updatedBy: actor,
    role: 'citizen',
    comment: `Case reopened by citizen: "${reason}"`,
  });

  report.messages.push({
    id: `msg-${Date.now()}`,
    reportId,
    senderId: 'citizen',
    senderName: actor,
    senderRole: 'citizen',
    content: `[CASE REOPENED]: ${reason}`,
    timestamp: now,
    isInternal: false,
    type: 'status_change',
  });

  saveReports(reports);
  return report;
}

export function resetToDemoData(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REPORTS));
  notifyListeners();
}

/**
 * Privacy-Conscious Public Statistics Aggregator
 * Strictly omits any personal names, contact info, exact coordinates, or internal notes.
 */
export function getPublicAggregateStats() {
  const reports = getReports();

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress').length;
  const triaged = reports.filter((r) => r.status === 'triaged' || r.status === 'assigned').length;
  const submitted = reports.filter((r) => r.status === 'submitted').length;
  const critical = reports.filter((r) => r.severity === 'critical').length;
  const high = reports.filter((r) => r.severity === 'high').length;
  const medium = reports.filter((r) => r.severity === 'medium').length;
  const low = reports.filter((r) => r.severity === 'low').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  reports.forEach((r) => {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
  });

  // Zone/District breakdown
  const zoneMap: Record<string, { total: number; resolved: number }> = {};
  reports.forEach((r) => {
    const zone = r.location?.zone || 'Metro Core';
    if (!zoneMap[zone]) zoneMap[zone] = { total: 0, resolved: 0 };
    zoneMap[zone].total++;
    if (r.status === 'resolved' || r.status === 'closed') {
      zoneMap[zone].resolved++;
    }
  });

  // Calculate average resolution time (hours)
  let totalResolvedHours = 0;
  let resolvedWithHistoryCount = 0;
  reports.forEach((r) => {
    if (r.resolution) {
      const created = new Date(r.createdAt).getTime();
      const res = new Date(r.resolution.resolvedAt).getTime();
      const diffHours = (res - created) / (1000 * 60 * 60);
      if (diffHours > 0) {
        totalResolvedHours += diffHours;
        resolvedWithHistoryCount++;
      }
    }
  });

  const avgResolutionHours =
    resolvedWithHistoryCount > 0
      ? Math.round((totalResolvedHours / resolvedWithHistoryCount) * 10) / 10
      : 14.5;

  return {
    total,
    resolved,
    inProgress,
    triaged,
    submitted,
    critical,
    high,
    medium,
    low,
    resolutionRate,
    avgResolutionHours,
    categoryBreakdown: categoryMap,
    zoneBreakdown: zoneMap,
  };
}
