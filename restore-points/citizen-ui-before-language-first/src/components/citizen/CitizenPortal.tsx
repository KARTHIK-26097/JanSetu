import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  MapPin,
  Mic,
  ChevronRight,
  FileText,
  MessageSquareQuote,
  ArrowLeft,
  FolderOpen,
} from 'lucide-react';
import type {
  Attachment,
  IssueCategory,
  LocationData,
  Report,
} from '../../types';
import { ReportForm } from './ReportForm';
import { ConversationReportFlow } from './ConversationReportFlow';
import { ReportDetailView } from './ReportDetailView';
import { createReport } from '../../services/storageService';
import { useTranslation } from '../../services/i18n';
import { PublicAccountabilityDashboard } from '../public/PublicAccountabilityDashboard';

interface CitizenPortalProps {
  reports: Report[];
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  onReportsUpdated: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  reports,
  currentLanguage,
  onLanguageChange,
  onReportsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'new' | 'track' | 'drafts' | 'public'>('home');
  // Reporting Mode: 'form' | 'conversation' (Talk)
  const [reportingMode, setReportingMode] = useState<'form' | 'conversation'>('conversation');
  // Selected Report for detail view
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Search & Filters in Tracker
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState('');

  // Shared draft data across Form and Conversation mode
  const [draftData, setDraftData] = useState<{
    description?: string;
    category?: IssueCategory;
    location?: LocationData;
    attachments?: Attachment[];
    citizenPhone?: string;
    citizenPhoneCountryCode?: string;
  }>({});

  // i18n hook — provides t() bound to currentLanguage
  const { t, isRTL } = useTranslation(currentLanguage);

  const handleReportSubmitted = (newReport: Report) => {
    onReportsUpdated();
    setSelectedReportId(newReport.id);
    setActiveTab('track');
  };

  const handleConversationComplete = (data: {
    description: string;
    language: string;
    spokenLanguage?: string;
    translatedDescription: string;
    transcriptText: string;
    hasVoice: boolean;
    audioAttachmentUrl?: string;
    category: IssueCategory;
    customCategoryDescription?: string;
    location: LocationData;
    attachments: Attachment[];
    safetyNotes?: string;
    citizenPhone?: string;
    citizenPhoneCountryCode?: string;
    citizenEmail?: string;
    addAnotherIssue?: boolean;
  }) => {
    const titleCategory =
      data.category === 'other' && data.customCategoryDescription
        ? data.customCategoryDescription.slice(0, 30).toUpperCase()
        : data.category.toUpperCase();

    const newReport = createReport({
      title: `${titleCategory}: ${data.description.slice(0, 48)}...`,
      originalDescription: data.description,
      originalLanguage: data.language,
      spokenLanguage: data.spokenLanguage || data.language,
      translatedDescription: data.translatedDescription,
      transcriptText: data.transcriptText,
      hasVoiceRecording: data.hasVoice,
      audioAttachmentUrl: data.audioAttachmentUrl,
      category: data.category,
      customCategoryDescription: data.customCategoryDescription,
      location: data.location,
      attachments: data.attachments,
      citizenName: 'Citizen Contributor',
      citizenContact: data.citizenPhone || data.citizenEmail || 'Confidential Phone',
      citizenPhone: data.citizenPhone || '',
      citizenPhoneCountryCode: data.citizenPhoneCountryCode || '+1',
      citizenEmail: data.citizenEmail || '',
    });

    onReportsUpdated();

    if (data.addAnotherIssue) {
      // Clear draft for clean second issue intake
      setDraftData({
        citizenPhone: data.citizenPhone,
        citizenPhoneCountryCode: data.citizenPhoneCountryCode,
      });
      setActiveTab('new');
    } else {
      setSelectedReportId(newReport.id);
      setActiveTab('track');
    }
  };

  // Filtered reports for tracker
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originalDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.translatedDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'resolved'
        ? r.status === 'resolved' || r.status === 'closed'
        : r.status !== 'resolved' && r.status !== 'closed';

    const matchesCategory =
      categoryFilter === 'all' ? true : r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  if (activeTab === 'home') {
    return <CitizenHome
      onSpeak={() => { setReportingMode('conversation'); setActiveTab('new'); }}
      onType={() => { setReportingMode('form'); setActiveTab('new'); }}
      onApplications={() => setActiveTab('track')}
      onPublic={() => setActiveTab('public')}
      language={currentLanguage}
    />;
  }

  // If a report is selected in Tracker view, show detail view
  if (selectedReport && activeTab === 'track') {
    return (
      <ReportDetailView
        report={selectedReport}
        onBack={() => setSelectedReportId(null)}
        onReportUpdated={() => onReportsUpdated()}
        currentLanguage={currentLanguage}
      />
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Quick Feedback Floating Button */}
      <div style={{ position: 'fixed', right: isRTL ? 'auto' : '1.25rem', left: isRTL ? '1.25rem' : 'auto', bottom: '1.25rem', zIndex: 20 }}>
        {showQuickFeedback && <div className="card" style={{ width: 'min(320px, calc(100vw - 2rem))', marginBottom: '.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <strong>{t('feedbackTitle')}</strong>
          <textarea
            className="form-input"
            rows={3}
            value={quickFeedback}
            onChange={(e) => setQuickFeedback(e.target.value)}
            placeholder={t('feedbackPlaceholder')}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuickFeedback(false)}>{t('close')}</button>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const items = JSON.parse(localStorage.getItem('civicvoice_site_feedback') || '[]');
              items.push({ comment: quickFeedback, date: new Date().toISOString() });
              localStorage.setItem('civicvoice_site_feedback', JSON.stringify(items));
              setQuickFeedback('');
              setShowQuickFeedback(false);
            }}>{t('btnSendFeedback')}</button>
          </div>
        </div>}
        <button className="btn btn-primary" onClick={() => setShowQuickFeedback((value) => !value)} aria-label={t('btnFeedback')}>
          <MessageSquareQuote size={17} /> {t('btnFeedback')}
        </button>
      </div>

      <div className="citizen-subnav">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setActiveTab('home'); setSelectedReportId(null); }}><ArrowLeft size={16} /><span>Home</span></button>
        {activeTab === 'new' ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReportingMode((mode) => mode === 'conversation' ? 'form' : 'conversation')}>
          {reportingMode === 'conversation' ? <FileText size={15} /> : <Mic size={15} />}
          <span>{reportingMode === 'conversation' ? 'Type instead' : 'Speak instead'}</span>
        </button> : <div className="citizen-section-links">
          <button type="button" className={`btn btn-sm ${activeTab === 'track' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('track')}><FolderOpen size={15} /><span>My Applications</span></button>
          <button type="button" className={`btn btn-sm ${activeTab === 'drafts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('drafts')}><FileText size={15} /><span>Drafts</span></button>
          <button type="button" className={`btn btn-sm ${activeTab === 'public' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('public')}><ListFilter size={15} /><span>Public updates</span></button>
        </div>}
      </div>

      {/* View 1: New Report (Form Mode or Conversation/Talk Mode) */}
      {activeTab === 'new' && (
        <div>
          {reportingMode === 'form' ? (
            <ReportForm
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              onReportSubmitted={handleReportSubmitted}
              onSwitchToConversation={() => setReportingMode('conversation')}
              initialData={draftData}
            />
          ) : (
            <ConversationReportFlow
              language={currentLanguage}
              onComplete={handleConversationComplete}
              onSwitchToForm={() => setReportingMode('form')}
              initialData={draftData}
            />
          )}
        </div>
      )}

      {/* View 2: Track Reports */}
      {activeTab === 'track' && (
        <div className="citizen-tracker-page" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2>My Applications</h2>
              <p style={{ color: 'var(--text-secondary)' }}>See updates on your reports.</p>
            </div>
          </div>

          {/* Search & Filters */}
          <details className="simple-optional-details">
            <summary>Search or filter reports</summary>
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: isRTL ? 'auto' : '12px',
                    right: isRTL ? '12px' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: isRTL ? '0.75rem' : '2.4rem', paddingRight: isRTL ? '2.4rem' : '0.75rem' }}
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="input-citizen-search"
                />
              </div>

              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(['all', 'active', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${
                      statusFilter === st ? 'btn-primary' : 'btn-secondary'
                    }`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'all' && `${t('filterAll')} (${reports.length})`}
                    {st === 'active' &&
                      `${t('filterActive')} (${
                        reports.filter((r) => r.status !== 'resolved' && r.status !== 'closed').length
                      })`}
                    {st === 'resolved' &&
                      `${t('filterResolved')} (${
                        reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length
                      })`}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by Category"
              >
                <option value="all">{t('filterAllCategories')}</option>
                <option value="roads">{t('roads')}</option>
                <option value="water">{t('water')}</option>
                <option value="street_lighting">{t('lighting')}</option>
                <option value="waste">{t('waste')}</option>
                <option value="bridges">{t('bridges')}</option>
                <option value="pollution">{t('pollution')}</option>
                <option value="transit">{t('transit')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
          </div>
          </details>

          {/* Report Cards List */}
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <h3>{t('emptyReportsTitle')}</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                {t('emptyReportsSubtitle')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: '1.25rem',
                  }}
                  onClick={() => setSelectedReportId(report.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedReportId(report.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 800 }}>
                        {report.id}
                      </span>
                      <span className={`badge badge-status-${report.status}`}>
                        {(() => {
                          const statusKeyMap: Record<string, string> = {
                            submitted: 'statusSubmitted',
                            triaged: 'statusTriaged',
                            assigned: 'statusAssigned',
                            in_progress: 'statusInProgress',
                            resolved: 'statusResolved',
                            closed: 'statusClosed',
                          };
                          return t(statusKeyMap[report.status] || 'statusSubmitted');
                        })()}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t('submittedOn')} {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineClamp: 2 }}>
                    {report.originalDescription}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} color="var(--brand-primary)" />
                        {report.location.address}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>{t('viewTimeline')}</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'drafts' && <DraftsPanel onResume={(draft) => {
        setDraftData(draft);
        setReportingMode(draft.mode || 'conversation');
        setActiveTab('new');
      }} />}
      {activeTab === 'public' && <PublicAccountabilityDashboard />}
    </div>
  );
};

function CitizenHome({ onSpeak, onType, onApplications, onPublic, language }: { onSpeak: () => void; onType: () => void; onApplications: () => void; onPublic: () => void; language: string }) {
  const { t } = useTranslation(language);
  return <section className="citizen-home" aria-labelledby="citizen-home-title">
    <div className="citizen-home-message">
      <div className="citizen-home-mic" aria-hidden="true">🎙️</div>
      <h1 id="citizen-home-title">{t('tagline')}</h1>
      <p>{t('whatHappened')}</p>
    </div>
    <div className="citizen-home-actions">
      <button type="button" className="citizen-home-action primary" onClick={onSpeak}><Mic size={19} /><span>{t('recordSpeech')}</span></button>
      <button type="button" className="citizen-home-action" onClick={onType}><FileText size={19} /><span>{t('formMode')}</span></button>
      <button type="button" className="citizen-home-action quiet" onClick={onApplications}><FolderOpen size={19} /><span>{t('trackReports')}</span></button>
    </div>
    <button type="button" className="citizen-public-link" onClick={onPublic}>Public updates</button>
  </section>;
}

type SavedDraft = { id: string; description?: string; category?: IssueCategory; mode?: 'form' | 'conversation'; savedAt: string };

function DraftsPanel({ onResume }: { onResume: (draft: SavedDraft) => void }) {
  const [drafts, setDrafts] = useState<SavedDraft[]>(() => JSON.parse(localStorage.getItem('civicvoice_drafts') || '[]'));
  const removeDraft = (id: string) => {
    const next = drafts.filter((draft) => draft.id !== id);
    localStorage.setItem('civicvoice_drafts', JSON.stringify(next));
    setDrafts(next);
  };
  return <section className="card citizen-simple-panel" aria-labelledby="drafts-heading">
    <h2 id="drafts-heading">Drafts</h2>
    <p>Finish a report you saved.</p>
    {drafts.length === 0 ? <p>No saved reports yet.</p> : drafts.map((draft) => <div key={draft.id} className="citizen-draft-row">
      <div><strong>{draft.category || 'Saved report'}</strong><p style={{ margin: 0 }}>{draft.description || 'No description yet'} · {new Date(draft.savedAt).toLocaleDateString()}</p></div>
      <div style={{ display: 'flex', gap: '.5rem' }}><button className="btn btn-primary btn-sm" onClick={() => onResume(draft)}>Continue</button><button className="btn btn-secondary btn-sm" onClick={() => removeDraft(draft.id)}>Delete</button></div>
    </div>)}
  </section>;
}
