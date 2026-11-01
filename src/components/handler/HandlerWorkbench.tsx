import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Search,
  UserCheck,
  MapPin,
  Layers,
  Send,
  Lock,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Activity,
  Mic,
  MessageSquareText,
} from 'lucide-react';
import type {
  Report,
  ReportStatus,
  UrgencyLevel,
  UserAccount,
} from '../../types';
import { MUNICIPAL_AUTHORITIES } from '../../services/triageEngine';
import {
  addMessageToReport,
  assignReport,
  resolveReport,
  updateReportSeverity,
  updateReportStatus,
} from '../../services/storageService';
import { AdminManagementPanel } from './AdminManagementPanel';
import { CitizenFeedbackInbox } from './CitizenFeedbackInbox';
import { getSiteFeedback, subscribeToSiteFeedback } from '../../services/feedbackService';

interface HandlerWorkbenchProps {
  reports: Report[];
  onReportsUpdated: () => void;
  authenticatedUser: UserAccount;
}

export const HandlerWorkbench: React.FC<HandlerWorkbenchProps> = ({
  reports,
  onReportsUpdated,
  authenticatedUser,
}) => {
  // Admin view tab: 'operations' | 'admin'
  const [workbenchView, setWorkbenchView] = useState<'operations' | 'admin' | 'feedback'>('operations');
  const [newFeedbackCount, setNewFeedbackCount] = useState(() => getSiteFeedback().filter((item) => !item.reviewedAt).length);

  useEffect(() => subscribeToSiteFeedback(() => {
    setNewFeedbackCount(getSiteFeedback().filter((item) => !item.reviewedAt).length);
  }), []);

  // Selected Report for detail inspection
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports[0]?.id || null
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAuthority, setFilterAuthority] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');

  // Active Message Tab in Detail: 'citizen' | 'internal'
  const [messageTab, setMessageTab] = useState<'citizen' | 'internal'>('citizen');
  const [messageInput, setMessageInput] = useState('');

  // Triage Override Form States
  const [overrideSeverity, setOverrideSeverity] = useState<UrgencyLevel | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Reassignment Form States
  const [reassignAuthorityId, setReassignAuthorityId] = useState('');
  const [assignedOfficerInput, setAssignedOfficerInput] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Formal Resolution Form States
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionEquipment, setResolutionEquipment] = useState('');

  // KPI calculations
  const totalCount = reports.length;
  const criticalCount = reports.filter((r) => r.severity === 'critical').length;
  const overdueCount = reports.filter((r) => r.isOverdue).length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(
    (r) => r.status === 'resolved' || r.status === 'closed'
  ).length;
  const newCount = reports.filter((r) => r.status === 'submitted').length;

  // Filter queue reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.translatedDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchQuery.toLowerCase());

    // Keep the case currently being edited in view even if its new status no longer matches the filter.
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus || r.id === selectedReportId;
    const matchesSeverity = filterSeverity === 'all' ? true : r.severity === filterSeverity;
    const matchesCategory = filterCategory === 'all' ? true : r.category === filterCategory;
    const matchesAuthority =
      filterAuthority === 'all' ? true : r.assignedAuthorityId === filterAuthority;
    const matchesZone = filterZone === 'all' ? true : r.location.zone === filterZone;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSeverity &&
      matchesCategory &&
      matchesAuthority &&
      matchesZone
    );
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Handler: Send Message or Internal Staff Note
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !messageInput.trim()) return;

    const isInternal = messageTab === 'internal';

    addMessageToReport(selectedReport.id, {
      senderId: authenticatedUser.id,
      senderName: isInternal
        ? `${authenticatedUser.name} (Staff Note)`
        : `${authenticatedUser.name} (${authenticatedUser.departmentName || 'Operations'})`,
      senderRole: 'handler',
      content: messageInput.trim(),
      isInternal,
      type: isInternal ? 'chat' : 'info_request',
    });

    setMessageInput('');
    onReportsUpdated();
  };

  // Handler: Status Update
  const handleStatusChange = (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    if (selectedReport.status === newStatus) return;
    if (newStatus === 'resolved') {
      setShowResolveModal(true);
      return;
    }
    updateReportStatus(
      selectedReport.id,
      newStatus,
      authenticatedUser.name,
      'handler',
      `Handler updated status to ${newStatus.replace('_', ' ').toUpperCase()}`
    );
    onReportsUpdated();
  };

  // Handler: Submit Severity Override
  const handleConfirmSeverityOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !overrideSeverity || !overrideReason.trim()) return;

    updateReportSeverity(
      selectedReport.id,
      overrideSeverity,
      overrideReason.trim(),
      authenticatedUser.name
    );
    setShowOverrideModal(false);
    setOverrideReason('');
    setOverrideSeverity(null);
    onReportsUpdated();
  };

  // Handler: Submit Assignment
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !reassignAuthorityId) return;

    assignReport(
      selectedReport.id,
      reassignAuthorityId,
      assignedOfficerInput.trim() || 'Rapid Duty Unit',
      authenticatedUser.name
    );
    setShowAssignModal(false);
    onReportsUpdated();
  };

  // Handler: Submit Formal Resolution
  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !resolutionSummary.trim() || !resolutionAction.trim()) return;

    resolveReport(selectedReport.id, {
      resolvedBy: authenticatedUser.name,
      handlerTitle: authenticatedUser.departmentName || 'Operations Lead',
      summary: resolutionSummary.trim(),
      actionTaken: resolutionAction.trim(),
      closureNotes: resolutionNotes.trim() || 'Quality checklist inspected and approved.',
      equipmentUsed: resolutionEquipment.trim() || 'Standard civil engineering equipment',
    });

    setShowResolveModal(false);
    setResolutionSummary('');
    setResolutionAction('');
    setResolutionNotes('');
    setResolutionEquipment('');
    onReportsUpdated();
  };

  return (
    <div>
      {/* Operations Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Handler Operations & Triage Workbench</h2>
            <p>
              Review explainable AI evaluations, override urgency, dispatch municipal departments, communicate with citizens, and log resolutions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {authenticatedUser.role === 'admin' && (
              <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${workbenchView === 'operations' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWorkbenchView('operations')}
                  id="tab-workbench-operations"
                >
                  Triage Queue
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${workbenchView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWorkbenchView('admin')}
                  id="tab-workbench-admin"
                >
                  Admin Governance
                </button>
              </div>
            )}

            {authenticatedUser.role === 'admin' && (
              <button
                type="button"
                className={`btn btn-sm ${workbenchView === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setWorkbenchView('feedback')}
                aria-label={`Citizen feedback${newFeedbackCount ? `, ${newFeedbackCount} new` : ''}`}
                aria-current={workbenchView === 'feedback' ? 'page' : undefined}
                id="tab-workbench-feedback"
              >
                <MessageSquareText size={16} />
                <span>Feedback</span>
                {newFeedbackCount > 0 && <span className="critical-count handler-feedback-count">{newFeedbackCount}</span>}
              </button>
            )}

            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid #10b981' }}>
              <Activity size={14} /> Dispatch Grid Online
            </span>
          </div>
        </div>
      </div>

      {workbenchView === 'admin' && authenticatedUser.role === 'admin' ? (
        <AdminManagementPanel currentAdmin={authenticatedUser} />
      ) : workbenchView === 'feedback' && authenticatedUser.role === 'admin' ? (
        <CitizenFeedbackInbox onBack={() => setWorkbenchView('operations')} />
      ) : (
        <>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <span className="stat-label">Total Reports</span>
          <div className="stat-value">{totalCount}</div>
          <span className="stat-desc">Unified database records</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #cbd5e1' }}>
          <span className="stat-label">New / Untriaged</span>
          <div className="stat-value">{newCount}</div>
          <span className="stat-desc">Awaiting initial queue action</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="stat-label" style={{ color: '#fca5a5' }}>
            Urgent / Critical
          </span>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {criticalCount}
          </div>
          <span className="stat-desc">4-Hour emergency response SLA</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="stat-label">SLA Overdue</span>
          <div className="stat-value" style={{ color: overdueCount > 0 ? '#f59e0b' : 'inherit' }}>
            {overdueCount}
          </div>
          <span className="stat-desc">Requires immediate escalation</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="stat-label">In Progress</span>
          <div className="stat-value">{inProgressCount}</div>
          <span className="stat-desc">Crews actively dispatched</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="stat-label">Resolved</span>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {resolvedCount}
          </div>
          <span className="stat-desc">Verified with closure notes</span>
        </div>
      </div>

      {/* Workbench Layout: Left (Queue & Filters) and Right (Detail & Actions) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Filter Bar & Report Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', fontSize: '0.85rem' }}
                  placeholder="Filter by ref, title, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="input-handler-search"
                />
              </div>
            </div>

            {/* Dropdown Filters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status:</label>
                <select
                  aria-label="Filter status"
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="triaged">Triaged</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity:</label>
                <select
                  aria-label="Filter severity"
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authority:</label>
                <select
                  aria-label="Filter authority"
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={filterAuthority}
                  onChange={(e) => setFilterAuthority(e.target.value)}
                >
                  <option value="all">All Authorities</option>
                  {MUNICIPAL_AUTHORITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} ({a.department.slice(0, 18)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Zone:</label>
                <select
                  aria-label="Filter zone"
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                >
                  <option value="all">All Zones</option>
                  <option value="Downtown">Downtown</option>
                  <option value="North River">North River</option>
                  <option value="Eastside">Eastside</option>
                  <option value="South Harbor">South Harbor</option>
                  <option value="West Industrial">West Industrial</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category:</label>
                <select
                  aria-label="Filter category"
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Issue Categories</option>
                  <option value="roads">Roads & Potholes</option>
                  <option value="water">Water & Drainage</option>
                  <option value="street_lighting">Street Lighting</option>
                  <option value="waste">Waste & Sanitation</option>
                  <option value="bridges">Bridges</option>
                  <option value="pollution">Pollution</option>
                  <option value="transit">Transit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Queue List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Queue: Showing {filteredReports.length} cases
            </span>

            {filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  className="card"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderColor: isSelected
                      ? 'var(--brand-accent)'
                      : report.severity === 'critical'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'var(--border-subtle)',
                    backgroundColor: isSelected
                      ? 'rgba(2, 132, 199, 0.12)'
                      : 'var(--bg-secondary)',
                    position: 'relative',
                  }}
                  onClick={() => setSelectedReportId(report.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedReportId(report.id)}
                >
                  {report.severity === 'critical' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: '#ef4444',
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderBottomLeftRadius: 'var(--radius-lg)',
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                        {report.id}
                      </span>
                      <span className={`badge badge-${report.severity}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                        {report.severity.toUpperCase()}
                      </span>
                      {report.isOverdue && (
                        <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <span className={`badge badge-status-${report.status}`} style={{ fontSize: '0.65rem' }}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.925rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {report.title}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>{report.assignedAuthorityName?.split(' ')[0]}</span>
                    <span>Zone: {report.location.zone}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Inspection Workbench */}
        {selectedReport ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Case Header Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                      {selectedReport.id}
                    </span>
                    <span className={`badge badge-${selectedReport.severity}`}>
                      {selectedReport.severity.toUpperCase()}
                    </span>
                    <span className={`badge badge-status-${selectedReport.status}`}>
                      {selectedReport.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {selectedReport.severityOverridden && (
                      <span className="badge badge-high" title={`Override Reason: ${selectedReport.severityOverrideReason}`}>
                        HANDLER OVERRIDDEN
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>
                    {selectedReport.title}
                  </h3>
                </div>

              </div>

              <div className="handler-status-control" aria-label="Change case status">
                <strong>Case status</strong>
                <div className="handler-status-options" role="group" aria-label="Choose a case status">
                  {([
                    ['submitted', 'Submitted'],
                    ['triaged', 'Triaged'],
                    ['assigned', 'Assigned'],
                    ['in_progress', 'In progress'],
                    ['resolved', 'Resolved'],
                    ['closed', 'Closed'],
                  ] as const).map(([status, label]) => {
                    const isCurrentStatus = selectedReport.status === status;
                    return <button
                      key={status}
                      type="button"
                      className={`btn btn-sm handler-status-option ${isCurrentStatus ? 'active' : ''}`}
                      aria-pressed={isCurrentStatus}
                      title={status === 'resolved' ? 'Resolution details are required' : `Set status to ${label}`}
                      onClick={() => handleStatusChange(status)}
                    >
                      {isCurrentStatus && <CheckCircle2 size={14} aria-hidden="true" />}
                      <span>{label}</span>
                    </button>;
                  })}
                </div>
                <span className="handler-status-hint">The highlighted status is active. Choose another to change it.</span>
              </div>

              {/* Action Buttons: Override Severity, Reassign Authority */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setOverrideSeverity(selectedReport.severity);
                    setShowOverrideModal(true);
                  }}
                  id="btn-override-severity"
                >
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span>Override Severity</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setReassignAuthorityId(selectedReport.assignedAuthorityId || 'auth-dot');
                    setAssignedOfficerInput(selectedReport.assignedOfficer || '');
                    setShowAssignModal(true);
                  }}
                  id="btn-reassign-team"
                >
                  <UserCheck size={13} color="#38bdf8" />
                  <span>Reassign Authority / Team</span>
                </button>

                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={13} />
                  <span>SLA: {selectedReport.slaHours}h target window</span>
                </div>
              </div>
            </div>

            {/* Explainable AI Triage Breakdown Card */}
            <div
              className="card"
              style={{
                borderColor:
                  selectedReport.severity === 'critical'
                    ? 'var(--urgency-critical-border)'
                    : 'var(--brand-accent)',
                backgroundColor: 'rgba(30, 41, 59, 0.75)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={17} color="#38bdf8" />
                  <span>Explainable Triage & Precautionary Guidance</span>
                </h4>
                <span className={`badge badge-${selectedReport.triage.suggestedSeverity}`}>
                  Triage Danger Index: {selectedReport.triage.immediateDangerScore} / 100
                </span>
              </div>

              {/* Explainability Matrix Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    1. Immediate Danger & Bodily Risk
                  </span>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {selectedReport.triage.riskToPeople}
                  </p>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    2. Scale & Service Disruption
                  </span>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {selectedReport.triage.scaleDisruption}
                  </p>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    3. Deterioration Rate
                  </span>
                  <p style={{ fontSize: '0.825rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {selectedReport.triage.worseningRate}
                  </p>
                </div>
              </div>

              {/* Explainable Factor Reasons List */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Why this urgency was computed:
                </span>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {selectedReport.triage.reasonFactors.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Precautionary Guidance Notice */}
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid #38bdf8',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong>System Guidance for Field Crews:</strong> {selectedReport.triage.safetyGuidance}
              </div>
            </div>

            {/* Dual Language & Evidence Images */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="#38bdf8" />
                <span>Original report and English translation</span>
              </h4>

              <div className="dual-lang-box" style={{ marginTop: 0 }}>
                <div className="lang-pane">
                  <div className="lang-pane-header">
                    <span className="lang-pane-tag">Original ({selectedReport.originalLanguage.toUpperCase()})</span>
                    {selectedReport.hasVoiceRecording && (
                      <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Mic size={11} /> Voice Input
                      </span>
                    )}
                  </div>
                  <p className="lang-pane-content">{selectedReport.originalDescription}</p>
                </div>

                <div className="lang-pane">
                  <div className="lang-pane-header">
                    <span className="lang-pane-tag">English translation</span>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Automatic demo translation when available; compare with original</span>
                  </div>
                  <p className="lang-pane-content">{selectedReport.translatedDescription}</p>
                </div>
              </div>

              {/* Photo Attachment */}
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    Citizen Uploaded Photo:
                  </span>
                  <div style={{ maxWidth: '380px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={selectedReport.attachments[0].url}
                      alt={selectedReport.attachments[0].name}
                      style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location & Map Card */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#38bdf8" />
                <span>Geographic Location & Sector</span>
              </h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedReport.location.address}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedReport.location.zone && `Area: ${selectedReport.location.zone}`}
                {selectedReport.location.lat != null && selectedReport.location.lng != null && ` • GPS: ${selectedReport.location.lat.toFixed(4)}, ${selectedReport.location.lng.toFixed(4)}`}
                {selectedReport.location.landmark && ` • Near: ${selectedReport.location.landmark}`}
              </p>

              {selectedReport.location.lat != null && selectedReport.location.lng != null && <div className="vector-map-canvas" title="Location pin">
                <div className="map-grid-lines" />
                <div className="map-pin-pulse">
                  <MapPin size={24} color="#38bdf8" fill="#0284c7" />
                </div>
              </div>}
            </div>

            {/* Dual Communication Panel: Citizen-Facing Updates VS Internal Staff Notes */}
            <div className="card">
              {/* Communication Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm ${
                    messageTab === 'citizen' ? 'btn-primary' : 'btn-secondary'
                  }`}
                  onClick={() => setMessageTab('citizen')}
                  id="tab-citizen-updates"
                >
                  <MessageSquare size={14} />
                  <span>Citizen Updates & Requests</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${
                    messageTab === 'internal' ? 'btn-danger' : 'btn-secondary'
                  }`}
                  onClick={() => setMessageTab('internal')}
                  id="tab-internal-notes"
                  style={{
                    backgroundColor:
                      messageTab === 'internal' ? '#b45309' : 'transparent',
                    borderColor: '#b45309',
                    color: messageTab === 'internal' ? '#fff' : '#fcd34d',
                  }}
                >
                  <Lock size={14} />
                  <span>Internal Staff Notes (Private)</span>
                </button>
              </div>

              {/* Privacy Notice Banner for active tab */}
              {messageTab === 'citizen' ? (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    border: '1px solid #0284c7',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#7dd3fc',
                    marginBottom: '0.75rem',
                  }}
                >
                  📢 <strong>Citizen-Facing:</strong> Messages sent here will appear immediately in the citizen's tracking dashboard.
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid #f59e0b',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#fde68a',
                    marginBottom: '0.75rem',
                  }}
                >
                  🔒 <strong>Confidential Internal Staff Note:</strong> Visible strictly to municipal staff and contractors. Filtered out from citizen views.
                </div>
              )}

              {/* Message Thread */}
              <div className="conversation-thread" style={{ minHeight: '220px' }}>
                {selectedReport.messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    No messages recorded yet.
                  </div>
                ) : (
                  selectedReport.messages.map((msg) => {
                    if (messageTab === 'internal' && !msg.isInternal) {
                      // On internal tab, show internal notes prominently
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`message-bubble ${
                          msg.isInternal
                            ? 'message-internal'
                            : msg.senderRole === 'citizen'
                            ? 'message-citizen'
                            : 'message-handler'
                        }`}
                      >
                        {msg.isInternal && (
                          <div className="internal-note-badge">
                            <Lock size={11} /> Staff Private Note
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                          {msg.senderName} ({msg.senderRole.toUpperCase()})
                        </div>
                        <p style={{ margin: 0 }}>{msg.content}</p>
                        <div className="message-meta">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isInternal ? <span>Not sent to citizen</span> : <span>Public update</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input for new message */}
              <form onSubmit={handleSendMessage} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    messageTab === 'citizen'
                      ? 'Type an update or request for more details to citizen...'
                      : 'Add confidential internal note (e.g. contractor dispatch, pipe diameter)...'
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  id="input-handler-message"
                />
                <button
                  type="submit"
                  className={messageTab === 'citizen' ? 'btn btn-primary' : 'btn btn-danger'}
                  disabled={!messageInput.trim()}
                  id="btn-handler-send"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>

            {/* Audit Trail Log */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#38bdf8" />
                <span>Timestamped Audit Trail</span>
              </h4>

              <div className="audit-log-list">
                {selectedReport.statusHistory.map((item) => (
                  <div key={item.id} className="audit-item">
                    <div className="audit-time">
                      {new Date(item.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {item.updatedBy} ({item.role})
                      </span>
                      <p className="audit-comment">{item.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Override Severity Modal */}
      {showOverrideModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Override Urgency Assessment
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              All severity overrides require a documented reason for transparent public audit records.
            </p>

            <form onSubmit={handleConfirmSeverityOverride}>
              <div className="form-group">
                <label className="form-label">New Urgency Level:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {(['critical', 'high', 'medium', 'low'] as UrgencyLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`btn btn-sm ${
                        overrideSeverity === lvl ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() => setOverrideSeverity(lvl)}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="override-reason-input">
                  Reason for Urgency Override: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="override-reason-input"
                  className="form-textarea"
                  placeholder="e.g. Field inspection confirmed proximity to hospital entrance; elevated risk..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOverrideModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-confirm-override"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Authority Modal */}
      {showAssignModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Assign or Reassign Department
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Route this infrastructure report to the responsible municipal team.
            </p>

            <form onSubmit={handleConfirmAssignment}>
              <div className="form-group">
                <label className="form-label" htmlFor="select-reassign-dept">
                  Department:
                </label>
                <select
                  id="select-reassign-dept"
                  className="form-select"
                  value={reassignAuthorityId}
                  onChange={(e) => setReassignAuthorityId(e.target.value)}
                >
                  {MUNICIPAL_AUTHORITIES.map((auth) => (
                    <option key={auth.id} value={auth.id}>
                      {auth.name} ({auth.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-field-lead">
                  Field Lead Officer / Crew Unit:
                </label>
                <input
                  id="input-field-lead"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Inspector Chen (Crew 2)"
                  value={assignedOfficerInput}
                  onChange={(e) => setAssignedOfficerInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-confirm-reassign"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Resolution Form Modal */}
      {showResolveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#10b981' }}>
              Formal Case Resolution
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Record repair details before marking this report resolved. The citizen will be notified and given the opportunity to rate the repair.
            </p>

            <form onSubmit={handleConfirmResolution}>
              <div className="form-group">
                <label className="form-label" htmlFor="resolution-summary-input">
                  Resolution Summary: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="resolution-summary-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Water main isolated and replaced; asphalt surface restored"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="resolution-action-input">
                  Action Taken: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="resolution-action-input"
                  className="form-textarea"
                  placeholder="e.g. Replaced 6-meter ductile iron pipe section; pressure testing passed at 65 PSI..."
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="resolution-equipment-input">
                  Equipment Deployed:
                </label>
                <input
                  id="resolution-equipment-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Backhoe excavator, asphalt hotbox, vibratory plate"
                  value={resolutionEquipment}
                  onChange={(e) => setResolutionEquipment(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="resolution-notes-input">
                  Closure Notes / Final Inspection:
                </label>
                <input
                  id="resolution-notes-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Safe for public traffic; final walkthrough completed by supervisor"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  id="btn-confirm-resolve"
                >
                  Mark Case Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
