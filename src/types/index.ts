export type IssueCategory =
  | 'roads'
  | 'bridges'
  | 'water'
  | 'waste'
  | 'pollution'
  | 'street_lighting'
  | 'transit'
  | 'other';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus =
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type ThemeMode =
  | 'theme-white-orange'
  | 'theme-high-contrast'
  | 'theme-soft-slate'
  | 'theme-warm-sand';

export type LanguageCode = string;

export interface LanguageOption {
  code: string;
  label: string;
  nativeName: string;
  script: string;
  direction?: 'ltr' | 'rtl';
  region: string;
  bcp47: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  type: string;
}

export interface LocationData {
  address: string;
  lat?: number;
  lng?: number;
  zone: string;
  landmark?: string;
}

export interface TriageExplainability {
  immediateDangerScore: number; // 0-100
  riskToPeople: string;
  scaleDisruption: string;
  worseningRate: string;
  suggestedSeverity: UrgencyLevel;
  suggestedCategory: IssueCategory;
  suggestedAuthorityId: string;
  suggestedAuthorityName: string;
  safetyGuidance: string; // Informational public safety notice
  reasonFactors: string[];
}

export interface AuthorityTeam {
  id: string;
  name: string;
  code: string;
  department: string;
  contactEmail: string;
  phone: string;
  activeOfficers: number;
  avgResponseHours: number;
  categoriesHandled: IssueCategory[];
  zonesCovered: string[];
}

export interface Message {
  id: string;
  reportId: string;
  senderId: string;
  senderName: string;
  senderRole: 'citizen' | 'handler' | 'system' | 'admin';
  content: string;
  timestamp: string;
  isInternal: boolean; // TRUE: Internal staff note (never visible to citizen). FALSE: Citizen-facing message
  type?: 'chat' | 'status_change' | 'info_request' | 'resolution';
}

export interface StatusHistoryItem {
  id: string;
  status: ReportStatus;
  timestamp: string;
  updatedBy: string;
  role: 'citizen' | 'handler' | 'system' | 'admin';
  comment?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ResolutionRecord {
  resolvedAt: string;
  resolvedBy: string;
  handlerTitle: string;
  summary: string;
  actionTaken: string;
  closureNotes?: string;
  equipmentUsed?: string;
}

export interface CitizenFeedback {
  rating: number; // 1 to 5
  satisfaction: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied';
  comment?: string;
  submittedAt: string;
}

export interface Report {
  id: string; // e.g. CV-2026-8942
  title: string;
  originalDescription: string;
  originalLanguage: string;
  spokenLanguage?: string;
  translatedDescription: string;
  transcriptText?: string;
  hasVoiceRecording?: boolean;
  audioAttachmentUrl?: string;
  category: IssueCategory;
  categoryConfirmed: boolean;
  customCategoryDescription?: string; // For 'Other issue' free-form
  severity: UrgencyLevel;
  severityOverridden: boolean;
  severityOverrideReason?: string;
  status: ReportStatus;
  location: LocationData;
  attachments: Attachment[];
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenPhoneCountryCode: string;
  citizenEmail?: string;
  assignedAuthorityId?: string;
  assignedAuthorityName?: string;
  assignedOfficer?: string;
  triage: TriageExplainability;
  createdAt: string;
  updatedAt: string;
  slaHours: number;
  isOverdue: boolean;
  statusHistory: StatusHistoryItem[];
  messages: Message[];
  resolution?: ResolutionRecord;
  feedback?: CitizenFeedback;
  reopenedCount: number;
  reopenReason?: string;
}

// User & Role Models
export type UserRole = 'citizen' | 'handler' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: string;
  departmentName?: string;
  passwordHash: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AdminAccessAudit {
  id: string;
  timestamp: string;
  action:
    | 'admin_bootstrap'
    | 'handler_approved'
    | 'handler_rejected'
    | 'handler_suspended'
    | 'handler_reinstated'
    | 'department_reassigned';
  targetUserId: string;
  targetUserName: string;
  actorId: string;
  actorName: string;
  details: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  expiresAt: string;
}

export type AppView = 'citizen' | 'handler' | 'public';
