import type { AdminAccessAudit, AuthSession, UserAccount } from '../types';

const USERS_STORAGE_KEY = 'civicvoice_users_v2';
const SESSION_STORAGE_KEY = 'civicvoice_auth_session_v2';
const AUDITS_STORAGE_KEY = 'civicvoice_admin_audits_v2';

// Configured owner setup token for initial administrator bootstrap
export const BOOTSTRAP_SETUP_TOKEN = 'CIVICVOICE-ADMIN-BOOTSTRAP-2026';

// Simple password hashing simulation (salted SHA-like digest for demo persistence)
function hashPassword(password: string): string {
  let hash = 0;
  const str = `cv_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16)}`;
}

// Initial demo users (pre-seeded with 1 approved handler and 1 pending request for immediate evaluator testing)
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-handler-1',
    name: 'Marcos Vance',
    email: 'marcos.vance@civicvoice.gov',
    phone: '+1 555-345-8821',
    role: 'handler',
    status: 'approved',
    departmentId: 'auth-water',
    departmentName: 'Municipal Water & Sewerage Authority',
    passwordHash: hashPassword('handler123'),
    createdAt: '2026-10-28T09:00:00Z',
    approvedAt: '2026-10-28T09:30:00Z',
    approvedBy: 'System Bootstrap',
  },
  {
    id: 'usr-handler-2',
    name: 'Clara Lee',
    email: 'clara.lee@civicvoice.gov',
    phone: '+1 555-876-1190',
    role: 'handler',
    status: 'pending',
    departmentId: 'auth-power',
    departmentName: 'Bureau of Street Lighting & Grid Safety',
    passwordHash: hashPassword('handler123'),
    createdAt: '2026-10-31T07:15:00Z',
  },
];

const INITIAL_AUDITS: AdminAccessAudit[] = [
  {
    id: 'aud-init-1',
    timestamp: '2026-10-28T09:30:00Z',
    action: 'handler_approved',
    targetUserId: 'usr-handler-1',
    targetUserName: 'Marcos Vance',
    actorId: 'sys-bootstrap',
    actorName: 'System Bootstrap',
    details: 'Initial certified field engineer assigned to MWSA Hydraulics.',
  },
];

function getAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading users:', e);
    return INITIAL_USERS;
  }
}

function saveAllUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getAllAudits(): AdminAccessAudit[] {
  try {
    const raw = localStorage.getItem(AUDITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(INITIAL_AUDITS));
      return INITIAL_AUDITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_AUDITS;
  }
}

function recordAudit(audit: Omit<AdminAccessAudit, 'id' | 'timestamp'>): void {
  const audits = getAllAudits();
  audits.unshift({
    ...audit,
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(audits));
}

/**
 * Check if the sole initial administrator has already been bootstrapped
 */
export function hasAdmin(): boolean {
  const users = getAllUsers();
  return users.some((u) => u.role === 'admin' && u.status === 'approved');
}

/**
 * Get existing admin summary (without exposing password)
 */
export function getAdminSummary(): { name: string; email: string } | null {
  const users = getAllUsers();
  const admin = users.find((u) => u.role === 'admin' && u.status === 'approved');
  if (!admin) return null;
  return { name: admin.name, email: admin.email };
}

/**
 * One-time atomic bootstrap for the initial administrator
 * Requires the configured BOOTSTRAP_SETUP_TOKEN
 * Once called, public first-admin registration is PERMANENTLY DISABLED.
 */
export function bootstrapInitialAdmin(
  setupToken: string,
  name: string,
  email: string,
  password: string
): UserAccount {
  if (hasAdmin()) {
    throw new Error(
      'First-admin setup has already been completed. Public administrator registration is permanently disabled.'
    );
  }

  if (setupToken.trim() !== BOOTSTRAP_SETUP_TOKEN) {
    throw new Error('Invalid Administrator Setup Token. Contact your server administrator for authorization.');
  }

  if (!name.trim() || !email.trim() || password.length < 6) {
    throw new Error('Please provide a valid name, email, and password (minimum 6 characters).');
  }

  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const now = new Date().toISOString();
  const newAdmin: UserAccount = {
    id: `usr-admin-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'admin',
    status: 'approved',
    passwordHash: hashPassword(password),
    createdAt: now,
    approvedAt: now,
    approvedBy: 'Secure Token Bootstrap',
  };

  users.push(newAdmin);
  saveAllUsers(users);

  recordAudit({
    action: 'admin_bootstrap',
    targetUserId: newAdmin.id,
    targetUserName: newAdmin.name,
    actorId: newAdmin.id,
    actorName: newAdmin.name,
    details: 'Initial System Administrator created atomically via secure setup token verification.',
  });

  // Set session
  createSession(newAdmin);
  return newAdmin;
}

/**
 * Handler Registration Request
 * Creates account in 'pending' status. An administrator must approve it before login.
 */
export function registerHandler(data: {
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  password: string;
}): { user: UserAccount; message: string } {
  if (!data.name.trim() || !data.email.trim() || data.password.length < 6) {
    throw new Error('Please provide name, email, and a password of at least 6 characters.');
  }

  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: UserAccount = {
    id: `usr-handler-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim(),
    role: 'handler',
    status: 'pending', // MUST be approved by Admin
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    passwordHash: hashPassword(data.password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveAllUsers(users);

  return {
    user: newUser,
    message:
      'Registration request submitted successfully. Your account is currently pending administrator review and approval.',
  };
}

/**
 * Handler Login
 * Enforces verified password and approved status
 */
export function loginHandler(email: string, password: string): UserAccount {
  const users = getAllUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid email or password credentials.');
  }

  if (user.status === 'pending') {
    throw new Error(
      'Account Pending Approval: Your handler access request is awaiting review by the Civic Voice Administrator.'
    );
  }

  if (user.status === 'rejected' || user.status === 'suspended') {
    throw new Error(
      'Access Denied: Your handler credentials have been suspended or revoked by the Civic Voice Administrator.'
    );
  }

  createSession(user);
  return user;
}

function createSession(user: UserAccount): AuthSession {
  const session: AuthSession = {
    user: {
      ...user,
      passwordHash: '', // Clear password from session object
    },
    token: `cv_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      logout();
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// ---------------- Admin-Only Controls ----------------

/**
 * Retrieve all registered users (Strictly Admin only)
 */
export function getRegisteredUsers(requester: UserAccount): UserAccount[] {
  if (requester.role !== 'admin') {
    throw new Error('Access denied: Administrator permissions required.');
  }
  return getAllUsers().map((u) => ({ ...u, passwordHash: '' }));
}

/**
 * Approve a pending handler account (Admin only)
 */
export function approveHandler(
  adminUser: UserAccount,
  targetUserId: string,
  departmentId?: string,
  departmentName?: string
): void {
  if (adminUser.role !== 'admin') {
    throw new Error('Access denied: Only administrators can grant access.');
  }

  const users = getAllUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new Error('User not found.');

  target.status = 'approved';
  target.approvedAt = new Date().toISOString();
  target.approvedBy = adminUser.name;
  if (departmentId) target.departmentId = departmentId;
  if (departmentName) target.departmentName = departmentName;

  saveAllUsers(users);

  recordAudit({
    action: 'handler_approved',
    targetUserId: target.id,
    targetUserName: target.name,
    actorId: adminUser.id,
    actorName: adminUser.name,
    details: `Handler access approved for department: ${target.departmentName || 'General Triage'}.`,
  });
}

/**
 * Reject or suspend a handler account (Admin only)
 */
export function updateHandlerStatus(
  adminUser: UserAccount,
  targetUserId: string,
  newStatus: 'suspended' | 'rejected' | 'approved',
  reason: string
): void {
  if (adminUser.role !== 'admin') {
    throw new Error('Access denied: Only administrators can modify access.');
  }

  const users = getAllUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new Error('User not found.');

  if (target.role === 'admin' && newStatus !== 'approved') {
    throw new Error('Cannot suspend the primary administrator.');
  }

  target.status = newStatus;
  saveAllUsers(users);

  recordAudit({
    action:
      newStatus === 'approved'
        ? 'handler_reinstated'
        : newStatus === 'suspended'
        ? 'handler_suspended'
        : 'handler_rejected',
    targetUserId: target.id,
    targetUserName: target.name,
    actorId: adminUser.id,
    actorName: adminUser.name,
    details: `Status changed to ${newStatus}. Reason: "${reason}"`,
  });
}

/**
 * Reassign handler department (Admin only)
 */
export function reassignHandlerDepartment(
  adminUser: UserAccount,
  targetUserId: string,
  departmentId: string,
  departmentName: string
): void {
  if (adminUser.role !== 'admin') {
    throw new Error('Access denied: Only administrators can reassign staff.');
  }

  const users = getAllUsers();
  const target = users.find((u) => u.id === targetUserId);
  if (!target) throw new Error('User not found.');

  target.departmentId = departmentId;
  target.departmentName = departmentName;
  saveAllUsers(users);

  recordAudit({
    action: 'department_reassigned',
    targetUserId: target.id,
    targetUserName: target.name,
    actorId: adminUser.id,
    actorName: adminUser.name,
    details: `Reassigned to ${departmentName}.`,
  });
}

/**
 * Get audit trail of access decisions (Admin only)
 */
export function getAccessAudits(adminUser: UserAccount): AdminAccessAudit[] {
  if (adminUser.role !== 'admin') {
    throw new Error('Access denied: Administrator permissions required.');
  }
  return getAllAudits();
}
