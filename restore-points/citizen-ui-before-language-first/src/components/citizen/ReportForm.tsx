import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  Info,
  Volume2,
  ShieldCheck,
  ArrowRight,
  Edit2,
} from 'lucide-react';
import type {
  Attachment,
  IssueCategory,
  LocationData,
  Report,
} from '../../types';
import {
  analyzeGrievance,
  translateToEnglish,
} from '../../services/triageEngine';
import {
  CivicSpeechRecognizer,
  DEMO_VOICE_SAMPLES,
} from '../../services/speechService';
import { createReport } from '../../services/storageService';
import {
  COUNTRY_PHONE_CODES,
  GLOBAL_LANGUAGES,
  getUIText,
  speakInstruction,
} from '../../services/languageService';

interface ReportFormProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  onReportSubmitted: (newReport: Report) => void;
  onSwitchToConversation: () => void;
  initialData?: {
    description?: string;
    category?: IssueCategory;
    location?: LocationData;
    attachments?: Attachment[];
    citizenPhoneCountryCode?: string;
  };
}

export const ReportForm: React.FC<ReportFormProps> = ({
  currentLanguage,
  onLanguageChange: _onLanguageChange,
  onReportSubmitted,
  onSwitchToConversation,
  initialData,
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [transcript, setTranscript] = useState('');
  const [hasVoice, setHasVoice] = useState(false);
  const [category, setCategory] = useState<IssueCategory>(initialData?.category || 'roads');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');
  const [address, setAddress] = useState(
    initialData?.location?.address || ''
  );
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialData?.location?.lat != null && initialData.location.lng != null
      ? { lat: initialData.location.lat, lng: initialData.location.lng }
      : null
  );
  const [zone, setZone] = useState(initialData?.location?.zone || '');
  const [locationError, setLocationError] = useState('');
  const [landmark, setLandmark] = useState(initialData?.location?.landmark || '');
  const citizenName = 'Citizen Contributor';
  const [phoneCountryCode, setPhoneCountryCode] = useState(initialData?.citizenPhoneCountryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  // Independent spoken language selector for speech
  const [spokenLanguage, setSpokenLanguage] = useState(currentLanguage);

  // Speech recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<CivicSpeechRecognizer | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Review step before submission
  const [isReviewing, setIsReviewing] = useState(false);

  // Submission confirmation state
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSpokenLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    const recognizer = new CivicSpeechRecognizer();
    setSpeechRecognizer(recognizer);
    return () => {
      recognizer.stop();
    };
  }, []);

  const handleStartRecording = () => {
    if (!speechRecognizer || isStopping) return;
    setSpeechError(null);
    setIsRecording(true);
    setHasVoice(true);

    speechRecognizer.start(
      spokenLanguage,
      (res) => {
        setTranscript(res.transcript);
        setDescription(res.transcript); // Directly place transcript into editable description field!
      },
      (err) => {
        setSpeechError(err);
        setIsRecording(false);
        setIsStopping(true);
      },
      () => {
        setIsRecording(false);
        setIsStopping(false);
      },
      description
    );
  };

  const handleStopRecording = () => {
    if (speechRecognizer) {
      if (speechRecognizer.isActive()) setIsStopping(true);
      speechRecognizer.stop();
    }
  };

  const handleUseVoiceSample = (sampleText: string) => {
    setHasVoice(true);
    setTranscript(sampleText);
    setDescription(sampleText);
  };

  const handleUseLocation = () => {
    setLocationError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAddress(
            `GPS Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Verified)`
          );
        },
        () => setLocationError('Could not find you. Type a nearby place instead.'),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Location is not available here. Type a nearby place instead.');
    }
  };

  const handleSelectDemoPhoto = (type: 'pothole' | 'water' | 'light' | 'waste') => {
    const urls: Record<string, { name: string; url: string; cat: IssueCategory }> = {
      pothole: { name: 'asphalt_pothole.jpg', url: '/demo-images/pothole.jpg', cat: 'roads' },
      water: { name: 'water_leak_main.jpg', url: '/demo-images/water-leak.jpg', cat: 'water' },
      light: { name: 'damaged_light_pole.jpg', url: '/demo-images/street-light.jpg', cat: 'street_lighting' },
      waste: { name: 'waste_overflow.jpg', url: '/demo-images/waste-dump.jpg', cat: 'waste' },
    };
    const item = urls[type];
    setAttachments([
      {
        id: `att-${Date.now()}`,
        name: item.name,
        url: item.url,
        sizeBytes: 1024000,
        type: 'image/jpeg',
      },
    ]);
    setCategory(item.cat);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      setAttachments([
        {
          id: `att-${Date.now()}`,
          name: file.name,
          url: objectUrl,
          sizeBytes: file.size,
          type: file.type,
        },
      ]);
    }
  };

  const handleListen = (text: string) => {
    speakInstruction(text, currentLanguage);
  };

  // Real-time explainable triage computation
  const triage = analyzeGrievance(description, category, address);
  const translation = translateToEnglish(description, currentLanguage);

  // Form Submission
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe what happened using speech or typing.');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Please provide your phone number so we can send SMS status updates.');
      return;
    }
    setIsReviewing(true);
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);

    const report = createReport({
      title:
        category === 'other' && customCategoryDescription
          ? `OTHER: ${customCategoryDescription}`
          : `${category.toUpperCase()}: ${description.slice(0, 48)}...`,
      originalDescription: description,
      originalLanguage: currentLanguage,
      translatedDescription: translation.translatedText,
      transcriptText: transcript || description,
      hasVoiceRecording: hasVoice,
      category,
      customCategoryDescription: category === 'other' ? customCategoryDescription : undefined,
      location: {
        address,
        lat: gpsCoordinates?.lat,
        lng: gpsCoordinates?.lng,
        zone,
        landmark,
      },
      attachments,
      citizenName: citizenName || 'Civic Contributor',
      citizenPhoneCountryCode: phoneCountryCode,
      citizenPhone: phoneNumber,
      citizenEmail: email || undefined,
    });

    setIsSubmitting(false);
    setIsReviewing(false);
    setSubmittedReport(report);
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem('civicvoice_drafts') || '[]');
    drafts.unshift({ id: `draft-${Date.now()}`, description, category, mode: 'form', savedAt: new Date().toISOString() });
    localStorage.setItem('civicvoice_drafts', JSON.stringify(drafts.slice(0, 20)));
    alert('Draft saved on this device. You can find it in My Drafts.');
  };

  const handleFinishAndTrack = () => {
    if (submittedReport) {
      onReportSubmitted(submittedReport);
    }
  };

  const handleReportAnother = () => {
    setSubmittedReport(null);
    setDescription('');
    setTranscript('');
    setAttachments([]);
    setCustomCategoryDescription('');
    setIsReviewing(false);
  };

  return (
    <div className="citizen-form-page" style={{ maxWidth: '620px', margin: '0 auto' }}>
      {/* Prominent Form / Talk Toggle Switcher */}
      <div className="reporting-mode-toggle-bar" role="tablist" aria-label="Reporting Mode">
        <button
          type="button"
          className="mode-toggle-option active"
          role="tab"
          aria-selected="true"
          id="tab-form-mode"
        >
          <Info size={19} />
          <span>{getUIText('formMode', currentLanguage)}</span>
        </button>

        <button
          type="button"
          className="mode-toggle-option"
          onClick={onSwitchToConversation}
          role="tab"
          aria-selected="false"
          id="tab-talk-mode"
        >
          <Mic size={19} />
          <span>{getUIText('talkMode', currentLanguage)}</span>
        </button>
      </div>

      {/* Main Container */}
      {!isReviewing ? (
        <form onSubmit={handleProceedToReview} className="card" style={{ padding: '2.25rem' }}>
          {/* Header with audio speaker support */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2>{getUIText('reportIssue', currentLanguage)}</h2>
                <button
                  type="button"
                  className="btn-speaker"
                  onClick={() => handleListen(getUIText('tagline', currentLanguage))}
                  title="Listen to instructions"
                  aria-label="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p style={{ marginTop: '0.25rem' }}>
                Speak or type. We will guide you.
              </p>
            </div>

            {/* Language Switcher Badge */}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Portal Language:
              </span>
              <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>
                {GLOBAL_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName || currentLanguage}
              </span>
            </div>
          </div>

          {/* Voice Dictation Component */}
          <div
            style={{
              backgroundColor: isRecording ? 'var(--brand-light)' : 'var(--bg-secondary)',
              border: `2px solid ${isRecording ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.75rem',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <Mic size={20} color={isRecording ? '#ef4444' : 'var(--brand-primary)'} />
                  {isStopping ? 'Finishing…' : isRecording ? 'Listening…' : 'Use your voice'}
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Your words will appear in the box below.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                  {GLOBAL_LANGUAGES.find((item) => item.code === spokenLanguage)?.nativeName || spokenLanguage}
                </span>

                {!isRecording && !isStopping ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartRecording}
                    id="btn-form-start-mic"
                  >
                    <Mic size={16} />
                    <span>{getUIText('recordSpeech', currentLanguage)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={isStopping ? 'btn btn-secondary' : 'btn btn-danger'}
                    onClick={handleStopRecording}
                    disabled={isStopping}
                    id="btn-form-stop-mic"
                  >
                    <Square size={16} />
                    <span>{isStopping ? 'Please wait…' : getUIText('stopRecording', currentLanguage)}</span>
                  </button>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="soundwave-visualizer" aria-label="Audio active wave">
                <div className="soundwave-bar" />
                <div className="soundwave-bar" />
                <div className="soundwave-bar" />
                <div className="soundwave-bar" />
                <div className="soundwave-bar" />
                <div className="soundwave-bar" />
              </div>
            )}

            {speechError && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--urgency-critical-bg)',
                  border: '1px solid var(--urgency-critical-border)',
                  color: 'var(--urgency-critical-text)',
                  fontSize: '0.875rem',
                }}
              >
                ⚠️ {speechError}
              </div>
            )}

            {/* Quick Demo Voice Presets */}
            <details className="simple-optional-details" style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
              <summary>Try a sample (demo)</summary>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Sample reports
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(DEMO_VOICE_SAMPLES[spokenLanguage] || DEMO_VOICE_SAMPLES.en).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="category-pill"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleUseVoiceSample(sample.transcript)}
                  >
                    🎙️ {sample.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Problem Description Input & Transcript review */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" htmlFor="form-description-input" style={{ margin: 0 }}>
                {getUIText('whatHappened', currentLanguage)} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                className="btn-speaker"
                style={{ width: '28px', height: '28px' }}
                onClick={() => handleListen(description || getUIText('whatHappened', currentLanguage))}
                title="Hear text out loud"
              >
                <Volume2 size={14} />
              </button>
            </div>

            <textarea
              id="form-description-input"
              className="form-textarea"
              placeholder="Tell us what happened"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />

            <span className="form-hint">
              {getUIText('transcriptHint', currentLanguage)}
            </span>
          </div>

          {/* Dual Language Box Preview */}

          {/* Issue Categories including "Other Issue" */}
          <div className="form-group">
            <label className="form-label">
              {getUIText('categories', currentLanguage)}:
            </label>
            <div className="category-pill-grid">
              {(
                [
                  { key: 'roads', label: getUIText('roads', currentLanguage), icon: '🛣️' },
                  { key: 'water', label: getUIText('water', currentLanguage), icon: '🚰' },
                  { key: 'street_lighting', label: getUIText('lighting', currentLanguage), icon: '💡' },
                  { key: 'waste', label: getUIText('waste', currentLanguage), icon: '🗑️' },
                  { key: 'bridges', label: getUIText('bridges', currentLanguage), icon: '🌉' },
                  { key: 'pollution', label: getUIText('pollution', currentLanguage), icon: '🏭' },
                  { key: 'other', label: getUIText('other', currentLanguage), icon: '📌' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`category-pill ${category === cat.key ? 'selected' : ''}`}
                  onClick={() => setCategory(cat.key as IssueCategory)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Free-form Custom Description for "Other Issue" */}
            {category === 'other' && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '1rem',
                  backgroundColor: 'var(--brand-light)',
                  border: '1px solid var(--brand-accent)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <label className="form-label" htmlFor="input-other-category-desc" style={{ color: 'var(--brand-primary)' }}>
                  Specify Your Custom Issue:
                </label>
                <input
                  id="input-other-category-desc"
                  type="text"
                  className="form-input"
                  placeholder={getUIText('otherPlaceholder', currentLanguage)}
                  value={customCategoryDescription}
                  onChange={(e) => setCustomCategoryDescription(e.target.value)}
                  required={category === 'other'}
                />
                <span className="form-hint">
                  You are not forced into predefined categories. Describe any civic, community, or structural issue.
                </span>
              </div>
            )}
          </div>

          {/* Location Input with "Use My Location" action */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" htmlFor="form-location-address" style={{ margin: 0 }}>
                {getUIText('whereHappened', currentLanguage)} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleUseLocation}
                id="btn-form-use-location"
              >
                <MapPin size={15} color="var(--brand-primary)" />
                <span>Find my location</span>
              </button>
            </div>

            <div>
              <input
                id="form-location-address"
                type="text"
                className="form-input"
                placeholder="Village, road, or nearby place"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setGpsCoordinates(null); }}
                required
              />

            </div>
            {locationError && <p role="alert" className="simple-field-error">{locationError}</p>}
            <details className="simple-optional-details">
              <summary>Add more location details (optional)</summary>
              <input type="text" className="form-input" style={{ marginTop: '.5rem' }} placeholder="Village, town, or district" value={zone} onChange={(e) => setZone(e.target.value)} />
              <input type="text" className="form-input" style={{ marginTop: '.5rem' }} placeholder="Near a shop, school, or other place" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
            </details>

          </div>

          {/* Citizen Identity: Phone Number (Required) & Email (Optional) */}
          <div className="form-group">
            <h4 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>Where can we send updates?</h4>
            <div>
              {/* Phone with Country Code */}
              <div>
                <label className="form-label" htmlFor="input-citizen-phone">
                  {getUIText('phoneLabel', currentLanguage)}: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <select
                    aria-label="Country Code"
                    className="form-select"
                    style={{ width: 'auto', minWidth: '100px' }}
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                  >
                    {COUNTRY_PHONE_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="input-citizen-phone"
                    type="tel"
                    className="form-input"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <span className="form-hint">
                  {getUIText('phoneHint', currentLanguage)}
                </span>
              </div>
              <details className="simple-optional-details">
              <summary>Email (optional)</summary>
              <div>
                <label className="form-label" htmlFor="input-citizen-email">
                  {getUIText('emailLabel', currentLanguage)}:
                </label>
                <input
                  id="input-citizen-email"
                  type="email"
                  className="form-input"
                  placeholder="Optional: your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="form-hint">
                  {getUIText('emailHint', currentLanguage)}
                </span>
              </div>
              </details>
            </div>

            {/* Privacy Explanation Banner */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={20} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your phone number stays private.
              </div>
            </div>
          </div>

          {/* Optional Image Upload with Preview, Replace, Remove */}
          <div className="form-group">
            <label className="form-label">{getUIText('addPhoto', currentLanguage)} (Optional):</label>

            {/* Demo Quick Presets */}
            <details className="simple-optional-details" style={{ marginBottom: '.75rem' }}>
              <summary>Try a sample photo (demo)</summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%' }}>
                Test Photos (Simulate phone camera captures):
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectDemoPhoto('pothole')}
              >
                📸 Pothole Photo
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectDemoPhoto('water')}
              >
                📸 Water Pipe Leak
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectDemoPhoto('light')}
              >
                📸 Broken Light Pole
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectDemoPhoto('waste')}
              >
                📸 Waste Dump
              </button>
            </div>
            </details>

            {/* Upload / Replace Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Camera size={15} />
                <span>{attachments.length > 0 ? 'Replace Photo' : 'Upload / Take Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>

              {attachments.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAttachments([])}
                  style={{ color: '#ef4444' }}
                >
                  Remove Photo
                </button>
              )}
            </div>

            {attachments.length > 0 && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <img
                  src={attachments[0].url}
                  alt={attachments[0].name}
                  style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{attachments[0].name}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Photo verified. Attached to report payload.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Review Step Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.6rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={handleSaveDraft}>Save draft</button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              id="btn-form-review"
            >
                <span>Next</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        /* Review Screen Before Final Submission */
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <h2>Check your report</h2>
            <p>Check your report before sending.</p>
          </div>

          {/* Automated Triage Preview Box */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              border: `2px solid ${
                triage.suggestedSeverity === 'critical'
                  ? 'var(--urgency-critical-border)'
                  : 'var(--brand-primary)'
              }`,
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Suggested team
                </span>
                <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
                  {triage.suggestedAuthorityName}
                </h3>
              </div>
              <span className={`badge badge-${triage.suggestedSeverity}`}>{triage.suggestedSeverity.toUpperCase()} priority</span>
            </div>

            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--brand-primary)',
                fontSize: '0.875rem',
              }}
            >
              {triage.safetyGuidance}
            </div>
          </div>

          {/* Report Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                DESCRIPTION ({currentLanguage.toUpperCase()}):
              </span>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>LOCATION:</span>
                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{address} ({zone})</p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CATEGORY:</span>
                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                  {category === 'other' ? `Other: ${customCategoryDescription}` : category.toUpperCase()}
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>SMS UPDATES TO:</span>
                <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{phoneCountryCode} {phoneNumber}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>Save draft</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsReviewing(false)}
            >
              <Edit2 size={16} />
              <span>Back to Edit</span>
            </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              id="btn-confirm-final-submit"
            >
              <Send size={18} />
              <span>{isSubmitting ? 'Sending…' : 'Send report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {submittedReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-light)',
                  border: '2px solid var(--brand-primary)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2>Grievance Successfully Logged</h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Your report has been entered into the municipal dispatch registry.
              </p>
            </div>

            {/* Reference Badge */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Official Reference Number
              </span>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--brand-primary)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.25rem',
                }}
              >
                {submittedReport.id}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Next Steps:</h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>
                  Assigned Authority: <strong>{submittedReport.assignedAuthorityName}</strong>
                </li>
                <li>
                  Assessed Severity: <strong>{submittedReport.severity.toUpperCase()}</strong> (Initial response target within {submittedReport.slaHours} hours)
                </li>
                <li>
                  Status updates and SMS alerts will be sent to <strong>{submittedReport.citizenPhoneCountryCode} {submittedReport.citizenPhone}</strong>
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReportAnother}
              >
                Report Another Issue
              </button>

              <button type="button" className="btn btn-secondary" onClick={() => {
                const receipt = `Civic Voice Application Receipt\nReference: ${submittedReport.id}\nIssue: ${submittedReport.title}\nLocation: ${submittedReport.location.address}\nStatus: ${submittedReport.status}\nSubmitted: ${new Date(submittedReport.createdAt).toLocaleString()}\nAssigned team: ${submittedReport.assignedAuthorityName || 'Pending assignment'}`;
                const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${submittedReport.id}-receipt.txt`; link.click(); URL.revokeObjectURL(link.href);
              }}>Download receipt</button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinishAndTrack}
                id="btn-confirm-track"
              >
                Track Status in Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
