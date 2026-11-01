import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  MapPin,
  Mic,
  Layers,
  Flag,
  ShieldCheck,
  Volume2,
  Phone,
} from 'lucide-react';
import type { Report, ReportStatus } from '../../types';
import {
  addMessageToReport,
  reopenReport,
  submitFeedback,
} from '../../services/storageService';
import { speakInstruction } from '../../services/languageService';
import { MUNICIPAL_AUTHORITIES } from '../../services/triageEngine';

interface ReportDetailViewProps {
  report: Report;
  onBack: () => void;
  onReportUpdated: (updated: Report) => void;
  currentLanguage?: string;
}

const TIMELINE_STEPS: ReportStatus[] = [
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'resolved',
];

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  report,
  onBack,
  onReportUpdated,
  currentLanguage: _currentLanguage,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showHandlerContact, setShowHandlerContact] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(report.feedback?.rating || 5);
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState<
    'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied'
  >(report.feedback?.satisfaction || 'very_satisfied');
  const [feedbackComment, setFeedbackComment] = useState(report.feedback?.comment || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!report.feedback);

  // Reopen or Flag modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'reopen' | 'flag'>('reopen');
  const [reopenReason, setReopenReason] = useState('');

  // Handle citizen message reply
  const handleSendCitizenReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    addMessageToReport(report.id, {
      senderId: report.citizenId,
      senderName: report.citizenName || 'Citizen',
      senderRole: 'citizen',
      content: replyText.trim(),
      isInternal: false, // Citizen messages are always public/visible to handler
      type: 'chat',
    });

    setReplyText('');
    onReportUpdated({ ...report });
  };

  // Handle feedback submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = submitFeedback(report.id, {
      rating: feedbackRating,
      satisfaction: feedbackSatisfaction,
      comment: feedbackComment,
    });
    setFeedbackSubmitted(true);
    onReportUpdated(updated);
  };

  // Handle case reopening or unresolved flag
  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    if (modalMode === 'reopen') {
      const updated = reopenReport(
        report.id,
        reopenReason.trim(),
        report.citizenName || 'Citizen'
      );
      setShowReopenModal(false);
      setReopenReason('');
      onReportUpdated(updated);
    } else {
      // Flag as still unresolved with message
      addMessageToReport(report.id, {
        senderId: report.citizenId,
        senderName: report.citizenName || 'Citizen',
        senderRole: 'citizen',
        content: `[URGENT CITIZEN FLAG - ISSUE STILL UNRESOLVED]: ${reopenReason.trim()}`,
        isInternal: false,
        type: 'status_change',
      });
      setShowReopenModal(false);
      setReopenReason('');
      onReportUpdated({ ...report });
    }
  };

  // Calculate timeline progress
  const currentStepIndex = TIMELINE_STEPS.indexOf(report.status);

  // Strictly filter messages so internal handler notes NEVER appear in citizen interface!
  const citizenVisibleMessages = report.messages.filter((m) => !m.isInternal);

  const handleSpeak = (text: string) => {
    speakInstruction(text, report.originalLanguage);
  };

  return (
    <div className="citizen-detail-page" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Back button & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onBack}
          id="btn-back-to-list"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReceipt(true)}>Receipt</button>
          <span className={`badge badge-status-${report.status}`}>
            {report.status.replace('_', ' ').toUpperCase()}
          </span>

          {/* Audio read button */}
          <button
            type="button"
            className="btn-speaker"
            onClick={() =>
              handleSpeak(
                `Report ${report.id}. Status is ${report.status.replace('_', ' ')}. ${report.title}.`
              )
            }
            title="Read report status out loud"
            aria-label="Listen to report status"
          >
            <Volume2 size={15} />
          </button>

          {/* Flag button if pending */}
          {report.status !== 'resolved' && report.status !== 'closed' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setModalMode('flag');
                setShowReopenModal(true);
              }}
              style={{ color: '#ef4444' }}
              title="Flag that this report is overdue or still unresolved"
            >
              <Flag size={14} />
              <span>Flag Unresolved</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Reference & Title Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                {report.id}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Submitted on {new Date(report.createdAt).toLocaleDateString()} at{' '}
                {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2>{report.title}</h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Assigned Authority
            </span>
            <button type="button" className="text-link" style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', background: 'none', border: 0, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowHandlerContact(true)}>
              {report.assignedOfficer || report.assignedAuthorityName || 'Triage Dispatch Center'}
            </button>
            {report.assignedOfficer && (
              <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)' }}>
                Field Lead: {report.assignedOfficer}
              </span>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div style={{ margin: '2rem 0 1rem' }}>
          <div className="status-timeline">
            <div className="timeline-track">
              <div
                className="timeline-progress"
                style={{
                  width: `${
                    currentStepIndex >= 0
                      ? (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;
              return (
                <div
                  key={step}
                  className={`timeline-step ${isCompleted ? 'completed' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="timeline-dot">
                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span className="timeline-label">{step.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showHandlerContact && (() => {
        const team = MUNICIPAL_AUTHORITIES.find((item) => item.id === report.assignedAuthorityId);
        return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="handler-contact-title"><div className="modal-content">
          <h2 id="handler-contact-title">Handler contact</h2><p><strong>{report.assignedOfficer || 'Assigned civic team'}</strong></p><p>{report.assignedAuthorityName || team?.name || 'Triage Dispatch Center'}</p>
          {team ? <><p>Phone: <a href={`tel:${team.phone}`}>{team.phone}</a></p><p>Email: <a href={`mailto:${team.contactEmail}`}>{team.contactEmail}</a></p></> : <p>Contact details have not been added for this assignment yet.</p>}
          <button type="button" className="btn btn-primary" onClick={() => setShowHandlerContact(false)}>Close</button>
        </div></div>;
      })()}

      {showReceipt && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><div className="modal-content">
        <h2 id="receipt-title">Application receipt</h2><p>Preview your report receipt before downloading.</p>
        <div className="card" style={{ margin: '1rem 0' }}><strong>Civic Voice · {report.id}</strong><p>{report.title}</p><p>Location: {report.location.address}</p><p>Status: {report.status.replace('_', ' ')}</p><p>Submitted: {new Date(report.createdAt).toLocaleString()}</p><p>Assigned to: {report.assignedAuthorityName || 'Pending assignment'}</p></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem' }}><button className="btn btn-secondary" onClick={() => setShowReceipt(false)}>Close</button><button className="btn btn-primary" onClick={() => { const content = `Civic Voice Application Receipt\\nReference: ${report.id}\\nIssue: ${report.title}\\nLocation: ${report.location.address}\\nStatus: ${report.status}\\nSubmitted: ${new Date(report.createdAt).toLocaleString()}\\nAssigned team: ${report.assignedAuthorityName || 'Pending assignment'}`; const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${report.id}-receipt.txt`; link.click(); URL.revokeObjectURL(url); }}>Download receipt</button></div>
      </div></div>}

      <details className="simple-optional-details citizen-detail-more">
      <summary>Messages and more details</summary>
      {/* Grid: Left Column (Details, Images, Location) & Right Column (Messages & Feedback) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Problem Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Dual Language Text Box */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="var(--brand-primary)" />
              <span>Original report text</span>
            </h4>

            <div className="dual-lang-box" style={{ marginTop: 0 }}>
              <div className="lang-pane">
                <div className="lang-pane-header">
                  <span className="lang-pane-tag">Original ({report.originalLanguage.toUpperCase()})</span>
                  {report.hasVoiceRecording && (
                    <span style={{ fontSize: '0.7rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Mic size={11} /> Voice Dictated
                    </span>
                  )}
                </div>
                <p className="lang-pane-content">{report.originalDescription}</p>
              </div>

            </div>

            {/* Safety Guidance Informational alert */}
            {report.triage?.safetyGuidance && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(234, 88, 12, 0.08)',
                  borderLeft: '4px solid var(--brand-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ display: 'block', color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
                  Temporary Precaution Guidance (Informational guidance only • Not an official emergency service):
                </strong>
                {report.triage.safetyGuidance}
              </div>
            )}
          </div>

          {/* Privacy & Contact Card */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#16a34a" />
              <span>Contact Safeguards & Privacy</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Phone size={14} color="var(--brand-primary)" />
                <strong>Primary Phone:</strong>
                <span>
                  {report.citizenPhoneCountryCode || '+1'} {report.citizenPhone || 'On File'}
                </span>
                <span className="badge badge-low" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>
                  Restricted Staff Access Only
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                This contact number is encrypted and isolated from public aggregates. Only assigned municipal field crews can access it to clarify location or provide progress notifications.
              </p>
            </div>
          </div>

          {/* Photo Attachment if available */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Evidence Photo</h4>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={report.attachments[0].url}
                  alt={report.attachments[0].name}
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                File: {report.attachments[0].name}
              </span>
            </div>
          )}

          {/* Location & Map Card */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="var(--brand-primary)" />
              <span>Location Coordinates & District</span>
            </h4>

            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {report.location.address}
            </p>
            {(report.location.zone || report.location.landmark) && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {report.location.zone && `Area: ${report.location.zone}`}
              {report.location.landmark && ` • Near: ${report.location.landmark}`}
            </p>}

            {/* Stylized vector map canvas */}
            {report.location.lat != null && report.location.lng != null && <div className="vector-map-canvas" title="Location pin">
              <div className="map-grid-lines" />
              <div className="map-pin-pulse">
                <MapPin size={24} color="var(--brand-primary)" fill="var(--brand-primary)" />
              </div>
            </div>}
          </div>

          {/* Status Audit History Log */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--brand-primary)" />
              <span>Transparent Status History</span>
            </h4>

            <div className="audit-log-list">
              {report.statusHistory.map((item) => (
                <div key={item.id} className="audit-item">
                  <div className="audit-time">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Right Column: Communication Thread & Resolution/Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Official Resolution Summary (if resolved) */}
          {report.resolution && (
            <div
              className="card"
              style={{
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <h3 style={{ fontSize: '1.2rem', color: '#16a34a' }}>Resolution Summary</h3>
              </div>

              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {report.resolution.summary}
              </p>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p>
                  <strong>Action Taken:</strong> {report.resolution.actionTaken}
                </p>
                {report.resolution.closureNotes && (
                  <p>
                    <strong>Inspection Notes:</strong> {report.resolution.closureNotes}
                  </p>
                )}
                {report.resolution.equipmentUsed && (
                  <p>
                    <strong>Equipment Deployed:</strong> {report.resolution.equipmentUsed}
                  </p>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Signed off by {report.resolution.resolvedBy} ({report.resolution.handlerTitle}) on{' '}
                  {new Date(report.resolution.resolvedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Citizen Feedback Bar (if resolved) */}
          {(report.status === 'resolved' || report.status === 'closed') && (
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                Citizen Satisfaction Feedback
              </h4>

              {feedbackSubmitted ? (
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid #16a34a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>Feedback Recorded: {feedbackRating} / 5 Stars</span>
                  </div>
                  {feedbackComment && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                      "{feedbackComment}"
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    How satisfied are you with the timeliness and quality of this municipal repair?
                  </p>

                  <div className="rating-stars" role="radiogroup" aria-label="Satisfaction rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= feedbackRating ? 'active' : ''}`}
                        onClick={() => setFeedbackRating(star)}
                        title={`${star} Stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {(['very_satisfied', 'satisfied', 'neutral', 'dissatisfied'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`category-pill ${feedbackSatisfaction === s ? 'selected' : ''}`}
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setFeedbackSatisfaction(s)}
                      >
                        {s === 'very_satisfied' && '⭐ Very Satisfied'}
                        {s === 'satisfied' && '👍 Satisfied'}
                        {s === 'neutral' && '😐 Neutral'}
                        {s === 'dissatisfied' && '👎 Dissatisfied'}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional comment on repair quality..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="submit" className="btn btn-accent btn-sm">
                      Submit Feedback
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setModalMode('reopen');
                        setShowReopenModal(true);
                      }}
                      style={{ color: '#ef4444' }}
                    >
                      <RotateCcw size={14} />
                      <span>Issue Still Unresolved? Reopen</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Citizen-Handler Live Conversation Thread */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={16} color="var(--brand-primary)" />
              <span>Official Communications & Inquiries</span>
            </h4>

            <div className="conversation-thread" style={{ minHeight: '260px' }}>
              {citizenVisibleMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  No messages yet. Dispatch updates and requests for info will appear here.
                </div>
              ) : (
                citizenVisibleMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      msg.senderRole === 'citizen' ? 'message-citizen' : 'message-handler'
                    }`}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.senderRole === 'citizen' ? 'var(--brand-primary)' : '#16a34a', marginBottom: '0.2rem' }}>
                      {msg.senderName} ({msg.senderRole.toUpperCase()})
                    </div>
                    <p style={{ margin: 0, color: 'inherit' }}>{msg.content}</p>
                    <div className="message-meta">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.type && (
                        <span style={{ textTransform: 'capitalize' }}>{msg.type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendCitizenReply} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Reply to the city triage officer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                id="input-citizen-reply"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!replyText.trim()}
                id="btn-citizen-send-reply"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
      </details>

      {/* Case Reopen / Flag Modal */}
      {showReopenModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#ef4444' }}>
              {modalMode === 'reopen' ? 'Reopen Grievance Case' : 'Flag Report as Still Unresolved'}
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              {modalMode === 'reopen'
                ? 'If the problem was not adequately repaired or has reoccurred, please explain what remains unresolved.'
                : 'If this report has had no action or the situation has worsened, please submit an urgent notice to the dispatch team.'}
            </p>

            <form onSubmit={handleConfirmAction}>
              <div className="form-group">
                <label className="form-label" htmlFor="reopen-reason-input">
                  Explanation of Ongoing Issue:
                </label>
                <textarea
                  id="reopen-reason-input"
                  className="form-textarea"
                  placeholder="e.g. Water is still leaking from pavement; crew has not arrived; condition is worsening..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReopenModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  id="btn-confirm-reopen"
                >
                  {modalMode === 'reopen' ? 'Confirm Reopen' : 'Send Urgent Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
