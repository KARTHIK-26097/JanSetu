import React, { useState } from 'react';
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserPlus,
  LogIn,
  Info,
} from 'lucide-react';
import {
  bootstrapInitialAdmin,
  BOOTSTRAP_SETUP_TOKEN,
  hasAdmin,
  loginHandler,
  registerHandler,
} from '../../services/authService';
import { MUNICIPAL_AUTHORITIES } from '../../services/triageEngine';
import type { UserAccount } from '../../types';

interface HandlerAuthModalProps {
  onSuccess: (user: UserAccount) => void;
  onCancel: () => void;
}

export const HandlerAuthModal: React.FC<HandlerAuthModalProps> = ({
  onSuccess,
  onCancel,
}) => {
  const adminExists = hasAdmin();

  // Active tab: 'login' | 'register' | 'bootstrap'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'bootstrap'>(
    !adminExists ? 'bootstrap' : 'login'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState(MUNICIPAL_AUTHORITIES[0].id);
  const [setupToken, setSetupToken] = useState('');

  // Status message states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Handle First-Admin Bootstrap
  const handleBootstrap = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const admin = bootstrapInitialAdmin(setupToken, name, email, password);
      setSuccessMsg('Initial System Administrator bootstrapped successfully! Logging in...');
      setTimeout(() => onSuccess(admin), 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bootstrap failed.');
    }
  };

  // 2. Handle Handler Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = loginHandler(email, password);
      setSuccessMsg(`Welcome back, ${user.name}! Logging into Operations Workbench...`);
      setTimeout(() => onSuccess(user), 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    }
  };

  // 3. Handle Handler Access Request
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const dept = MUNICIPAL_AUTHORITIES.find((d) => d.id === departmentId);
      const res = registerHandler({
        name,
        email,
        phone,
        departmentId,
        departmentName: dept?.name || 'General Triage',
        password,
      });

      setSuccessMsg(res.message);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration request failed.');
    }
  };

  // Quick Demo Fillers for Evaluator Convenience
  const handleQuickDemoHandler = () => {
    setEmail('marcos.vance@civicvoice.gov');
    setPassword('handler123');
    setActiveTab('login');
  };

  const handleQuickDemoAdminFill = () => {
    setSetupToken(BOOTSTRAP_SETUP_TOKEN);
    setName('Administrator Sarah Chen');
    setEmail('sarah.chen@civicvoice.gov');
    setPassword('admin1234');
    setActiveTab('bootstrap');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Handler Authentication">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-light)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <Shield size={30} />
          </div>

          <h2>Handler Operations Portal</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Restricted access. Authentication and administrator authorization required.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem',
            marginBottom: '1.5rem',
            gap: '0.35rem',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            id="tab-auth-login"
          >
            <LogIn size={15} />
            <span>Staff Login</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            id="tab-auth-register"
          >
            <UserPlus size={15} />
            <span>Request Access</span>
          </button>

          {!adminExists && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'bootstrap' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => {
                setActiveTab('bootstrap');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              id="tab-auth-bootstrap"
            >
              <KeyRound size={15} />
              <span>Initial Admin Setup</span>
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--urgency-critical-bg)',
              border: '1px solid var(--urgency-critical-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--urgency-critical-text)',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--urgency-medium-bg)',
              border: '1px solid var(--urgency-medium-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--urgency-medium-text)',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Staff Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-login-email">
                Staff Work Email:
              </label>
              <input
                id="input-login-email"
                type="email"
                className="form-input"
                placeholder="e.g. marcos.vance@civicvoice.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-login-password">
                Password:
              </label>
              <input
                id="input-login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '1rem' }}
              id="btn-submit-login"
            >
              <LogIn size={18} />
              <span>Log In to Operations</span>
            </button>

            {/* Quick Demo Pre-seed Button */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                marginTop: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Evaluator Demo Shortcuts:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleQuickDemoHandler}
                  id="btn-demo-quick-handler"
                >
                  ⚡ Fill Approved Handler (Marcos Vance)
                </button>
                {!adminExists && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleQuickDemoAdminFill}
                    id="btn-demo-quick-admin"
                  >
                    ⚡ Initial Admin Setup Demo
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Request Handler Access */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-reg-name">Full Name:</label>
              <input
                id="input-reg-name"
                type="text"
                className="form-input"
                placeholder="Officer Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-reg-email">Work Email:</label>
              <input
                id="input-reg-email"
                type="email"
                className="form-input"
                placeholder="officer@civicvoice.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-reg-dept">Department / Division:</label>
              <select
                id="select-reg-dept"
                className="form-select"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {MUNICIPAL_AUTHORITIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-reg-phone">Contact Phone (Optional):</label>
              <input
                id="input-reg-phone"
                type="text"
                className="form-input"
                placeholder="+1 555-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-reg-pass">Create Password (Min 6 chars):</label>
              <input
                id="input-reg-pass"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--brand-light)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brand-accent)',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
              }}
            >
              <Info size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: 'var(--brand-primary)' }} />
              <strong>Approval Policy:</strong> All handler accounts start as <em>Pending</em> and must be approved by the Civic Voice Administrator before access is granted.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              id="btn-submit-registration"
            >
              <UserPlus size={18} />
              <span>Submit Access Request</span>
            </button>
          </form>
        )}

        {/* Tab 3: One-Time First-Admin Setup */}
        {activeTab === 'bootstrap' && !adminExists && (
          <form onSubmit={handleBootstrap}>
            <div
              style={{
                padding: '0.85rem',
                backgroundColor: 'var(--brand-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--brand-primary)',
                marginBottom: '1.25rem',
              }}
            >
              <h4 style={{ color: 'var(--brand-primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                One-Time Administrator Bootstrap
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                To initialize the system, provide the site owner's secure setup token. This atomically creates the sole initial administrator and permanently locks public admin registration.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-setup-token">
                Secure Setup Token: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="input-setup-token"
                type="text"
                className="form-input"
                placeholder="Enter setup token from site owner..."
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                required
              />
              <span className="form-hint">
                Configured site token: <code>{BOOTSTRAP_SETUP_TOKEN}</code>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-admin-name">Admin Full Name:</label>
              <input
                id="input-admin-name"
                type="text"
                className="form-input"
                placeholder="e.g. Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-admin-email">Admin Email:</label>
              <input
                id="input-admin-email"
                type="email"
                className="form-input"
                placeholder="admin@civicvoice.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-admin-pass">Admin Password (Min 6 chars):</label>
              <input
                id="input-admin-pass"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleQuickDemoAdminFill}
              >
                ⚡ Fill Demo Admin Info
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                id="btn-submit-bootstrap"
              >
                <KeyRound size={17} />
                <span>Initialize Admin & Log In</span>
              </button>
            </div>
          </form>
        )}

        {/* Cancel Button */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
