import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Send,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Volume2,
  Camera,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { IssueCategory, Attachment, LocationData } from '../../types';
import {
  analyzeGrievance,
  translateToEnglish,
} from '../../services/triageEngine';
import {
  CivicSpeechRecognizer,
  DEMO_VOICE_SAMPLES,
  type RecorderState,
} from '../../services/speechService';
import {
  GLOBAL_LANGUAGES,
  COUNTRY_PHONE_CODES,
  speakInstruction,
} from '../../services/languageService';

interface ConversationReportFlowProps {
  language: string;
  onComplete: (data: {
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
  }) => void;
  onSwitchToForm: () => void;
  initialData?: {
    description?: string;
    category?: IssueCategory;
    location?: LocationData;
    attachments?: Attachment[];
    citizenPhone?: string;
    citizenPhoneCountryCode?: string;
  };
}

export const ConversationReportFlow: React.FC<ConversationReportFlowProps> = ({
  language,
  onComplete,
  onSwitchToForm,
  initialData,
}) => {
  // Steps:
  // 0: Problem Description (Talk / Dictate / Type)
  // 1: Issue Category & Other Specification
  // 2: Location
  // 3: Photos (Optional)
  // 4: Immediate Danger & Safety Notes
  // 5: Citizen Contact (Phone & Optional Email)
  // 6: Review & Final Submission / Add Another Issue
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form Fields
  const [description, setDescription] = useState(initialData?.description || '');
  const [transcript, setTranscript] = useState('');
  const [hasVoice, setHasVoice] = useState(false);
  const spokenLanguage = language;

  // Category
  const [category, setCategory] = useState<IssueCategory>(initialData?.category || 'roads');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');

  // Location
  const [locationAddress, setLocationAddress] = useState(initialData?.location?.address || '');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialData?.location?.lat != null && initialData.location.lng != null
      ? { lat: initialData.location.lat, lng: initialData.location.lng }
      : null
  );
  const [locationZone, setLocationZone] = useState(initialData?.location?.zone || '');
  const [locationError, setLocationError] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  // Safety
  const [safetyNotes, setSafetyNotes] = useState('');

  // Contact
  const [citizenPhoneCountryCode, setCitizenPhoneCountryCode] = useState(
    initialData?.citizenPhoneCountryCode || '+91'
  );
  const [citizenPhone, setCitizenPhone] = useState(initialData?.citizenPhone || '');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Follow-up: Add another issue
  const [addAnotherIssue] = useState(false);

  // Voice recording state
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [speechRecognizer, setSpeechRecognizer] = useState<CivicSpeechRecognizer | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Initialize speech recognizer
  useEffect(() => {
    const recognizer = new CivicSpeechRecognizer();
    setSpeechRecognizer(recognizer);
    return () => {
      recognizer.stop();
    };
  }, []);

  useEffect(() => {
    if (speechRecognizer?.isActive()) {
      setRecorderState('stopping');
      speechRecognizer.stop();
    } else {
      setRecorderState('idle');
    }
    setSpeechError(null);
  }, [language, speechRecognizer]);

  // Voice Recording handlers
  const handleStartRecording = () => {
    if (!speechRecognizer || recorderState === 'stopping') return;
    setSpeechError(null);
    setRecorderState('recording');
    setHasVoice(true);

    speechRecognizer.start(
      spokenLanguage,
      (res) => {
        setTranscript(res.transcript);
        // Directly place recognized speech into editable description
        setDescription(res.transcript);
      },
      (err) => {
        setSpeechError(err);
        setRecorderState('stopping');
      },
      () => {
        setRecorderState('transcript');
      },
      description
    );
  };

  const handleStopRecording = () => {
    if (speechRecognizer) {
      setRecorderState('stopping');
      speechRecognizer.stop();
    }
  };

  // Test preset voice samples
  const handleUseVoiceSample = (sampleText: string) => {
    setHasVoice(true);
    setTranscript(sampleText);
    setDescription(sampleText);
    setRecorderState('transcript');
    setSpeechError(null);
  };

  const handleUseLocation = () => {
    setLocationError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationAddress(
            `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
          );
        },
        () => setLocationError('Could not find you. Type a nearby place instead.'),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Location is not available here. Type a nearby place instead.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments([
          {
            id: `att-${Date.now()}`,
            name: file.name,
            url: event.target?.result as string,
            sizeBytes: file.size,
            type: file.type || 'image/jpeg',
          },
        ]);
      };
      reader.readAsDataURL(file);
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

  const handleNext = () => {
    if (currentStep === 0 && !description.trim()) {
      alert('Please describe your civic issue by voice or typing.');
      return;
    }
    if (currentStep === 1 && category === 'other' && !customCategoryDescription.trim()) {
      alert('Please describe your specific issue in the description box.');
      return;
    }
    if (currentStep === 2 && !locationAddress.trim()) {
      setLocationError('Type a nearby place or use your location.');
      return;
    }
    if (currentStep === 5) {
      if (!citizenPhone.trim() || citizenPhone.replace(/\D/g, '').length < 6) {
        setPhoneError('Please enter a valid phone number so staff can reach you if needed.');
        return;
      }
      setPhoneError('');
    }
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    const fullText = description + (safetyNotes ? ` (Safety Concerns: ${safetyNotes})` : '');
    const { translatedText } = translateToEnglish(fullText, language);

    onComplete({
      description: fullText,
      language,
      spokenLanguage,
      translatedDescription: translatedText,
      transcriptText: transcript || description,
      hasVoice,
      category,
      customCategoryDescription: category === 'other' ? customCategoryDescription : undefined,
      location: {
        address: locationAddress,
        lat: gpsCoordinates?.lat,
        lng: gpsCoordinates?.lng,
        zone: locationZone,
      },
      attachments,
      safetyNotes,
      citizenPhone: citizenPhone.trim(),
      citizenPhoneCountryCode,
      citizenEmail: citizenEmail.trim(),
      addAnotherIssue,
    });
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem('civicvoice_drafts') || '[]');
    drafts.unshift({ id: `draft-${Date.now()}`, description, category, mode: 'conversation', savedAt: new Date().toISOString() });
    localStorage.setItem('civicvoice_drafts', JSON.stringify(drafts.slice(0, 20)));
    alert('Draft saved on this device. You can find it in My Drafts.');
  };

  const triagePreview = analyzeGrievance(description, category, locationAddress);

  // Audio prompt helper
  const handleSpeak = (text: string) => {
    speakInstruction(text, language);
  };

  return (
    <div className="card citizen-report-flow" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Guided Chat Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              border: '1.5px solid var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Report a problem</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} aria-live="polite">
              Step {currentStep + 1} of 7
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onSwitchToForm}
          title="Type your answers instead"
          id="btn-switch-to-form"
        >
          <Edit3 size={14} />
          <span>Type instead</span>
        </button>
      </div>

      {/* Progress Track */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2, 3, 4, 5, 6].map((stepIdx) => (
          <div
            key={stepIdx}
            style={{
              flex: 1,
              height: '5px',
              borderRadius: '3px',
              backgroundColor:
                stepIdx <= currentStep ? 'var(--brand-primary)' : 'var(--border-subtle)',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>

      {/* STEP 0: What Happened? (Talk mode & Voice transcription) */}
      {currentStep === 0 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                What happened?
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tap “Start speaking” or type a short description below.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'What civic problem would you like to report? Press the microphone button to speak, or type into the box.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Voice Microphone Controls Card */}
          <div className={`mic-control-card ${recorderState === 'recording' ? 'mic-active-state' : ''}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mic size={18} color={recorderState === 'recording' ? '#ef4444' : 'var(--brand-primary)'} />
                  {recorderState === 'stopping'
                    ? 'Finishing speech recognition...'
                    : recorderState === 'recording'
                    ? 'Listening live... speak clearly into microphone'
                    : recorderState === 'transcript'
                    ? 'Your words are ready to check'
                    : 'Use your voice'}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '.35rem 0 0' }}>
                  Listening in your selected language: {GLOBAL_LANGUAGES.find((item) => item.code === language)?.nativeName || language}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {recorderState === 'stopping' ? (
                  <button type="button" className="btn btn-secondary btn-sm" disabled><Mic size={16} /><span>Please wait…</span></button>
                ) : recorderState !== 'recording' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleStartRecording}
                    id="btn-convo-start-mic"
                  >
                    <Mic size={16} />
                    <span>Start speaking</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleStopRecording}
                    id="btn-convo-stop-mic"
                  >
                    <Square size={16} />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Soundwave animation when active */}
            {recorderState === 'recording' && (
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
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{speechError}</span>
              </div>
            )}

            {/* Keep demo examples available without crowding the reporting controls. */}
            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '.85rem' }}>Try a sample (demo)</summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '.5rem' }}>
                {(DEMO_VOICE_SAMPLES[spokenLanguage] || DEMO_VOICE_SAMPLES.en).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="category-pill"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => handleUseVoiceSample(sample.transcript)}
                  >
                    🎙️ {sample.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Description Textarea / Transcript review */}
          <div className="form-group">
            <label className="form-label" htmlFor="convo-desc-input">
              Your description:
            </label>
            <textarea
              id="convo-desc-input"
              className="form-textarea"
              placeholder="For example: There is a water leak on my street."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            {transcript && (
              <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                <CheckCircle2 size={13} /> Your speech is in the box. You can change it.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step0-next"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Category & Other Issue */}
      {currentStep === 1 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                What kind of problem is it?
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Choose one.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'What kind of problem is it? Choose one.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div className="category-pill-grid">
            {(
              [
                { id: 'roads', label: 'Road', icon: '🛣️' },
                { id: 'water', label: 'Water', icon: '🚰' },
                { id: 'street_lighting', label: 'Lights', icon: '💡' },
                { id: 'waste', label: 'Waste', icon: '🗑️' },
                { id: 'bridges', label: 'Bridge', icon: '🌉' },
                { id: 'pollution', label: 'Pollution', icon: '🏭' },
                { id: 'transit', label: 'Bus / Transit', icon: '🚌' },
                { id: 'other', label: 'Other', icon: '📌' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`category-pill ${category === item.id ? 'selected' : ''}`}
                onClick={() => setCategory(item.id as IssueCategory)}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* If "Other" is selected, show free-form description input */}
          {category === 'other' && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                backgroundColor: 'rgba(234, 88, 12, 0.05)',
                border: '1.5px solid var(--brand-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <label className="form-label" htmlFor="convo-other-description" style={{ color: 'var(--brand-primary)' }}>
                Describe your specific issue (Free-form description):
              </label>
              <input
                id="convo-other-description"
                type="text"
                className="form-input"
                placeholder="e.g. Broken playground swing, fallen tree branch, sidewalk obstruction..."
                value={customCategoryDescription}
                onChange={(e) => setCustomCategoryDescription(e.target.value)}
                autoFocus
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                You are never forced into an existing category. Our triage team will review your free-form description.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(0)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step1-next"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Location */}
      {currentStep === 2 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                Where is it?
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Add an address or use your location.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'Where is it? Type a nearby place or use your location.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleUseLocation}
              id="btn-convo-use-location"
            >
              <MapPin size={15} color="var(--brand-primary)" />
              <span>Find my location</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="convo-location-address">
              Nearby place or road:
            </label>
            <input
              id="convo-location-address"
              type="text"
              className="form-input"
              placeholder="Village, road, or nearby place"
              value={locationAddress}
              onChange={(e) => { setLocationAddress(e.target.value); setGpsCoordinates(null); }}
            />
            {locationError && <p role="alert" className="simple-field-error">{locationError}</p>}
          </div>

          <details className="simple-optional-details">
            <summary>Add village or district (optional)</summary>
            <input id="convo-location-zone" type="text" className="form-input" placeholder="Village, town, or district" value={locationZone} onChange={(e) => setLocationZone(e.target.value)} />
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step2-next"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Optional Photos */}
      {currentStep === 3 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                Add a photo?
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                This is optional.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'Add a photo? This is optional.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Active Photo Preview & Replace/Remove */}
          {attachments.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={attachments[0].url}
                  alt={attachments[0].name}
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{attachments[0].name}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#16a34a' }}>
                    ✓ Photo attached for field inspection
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <RefreshCw size={13} />
                  <span>Replace</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAttachments([])}
                >
                  <Trash2 size={13} color="#ef4444" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Camera size={32} color="var(--brand-primary)" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                Take or upload a photo from your device
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                PNG, JPG or WEBP up to 10MB • Optional
              </p>
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                <span>Select Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          )}

          {/* Demo photos stay available but out of the main path. */}
          <details className="simple-optional-details">
            <summary>Try a sample photo (demo)</summary>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Or Pick a Sample Civic Photo:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <button
                type="button"
                className="card"
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: attachments.some((a) => a.name.includes('pothole'))
                    ? 'var(--brand-primary)'
                    : 'var(--border-subtle)',
                }}
                onClick={() => handleSelectDemoPhoto('pothole')}
              >
                <img
                  src="/demo-images/pothole.jpg"
                  alt="Road Pothole"
                  style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>Pothole</span>
              </button>

              <button
                type="button"
                className="card"
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: attachments.some((a) => a.name.includes('water'))
                    ? 'var(--brand-primary)'
                    : 'var(--border-subtle)',
                }}
                onClick={() => handleSelectDemoPhoto('water')}
              >
                <img
                  src="/demo-images/water-leak.jpg"
                  alt="Water Leak"
                  style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>Water Burst</span>
              </button>

              <button
                type="button"
                className="card"
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: attachments.some((a) => a.name.includes('light'))
                    ? 'var(--brand-primary)'
                    : 'var(--border-subtle)',
                }}
                onClick={() => handleSelectDemoPhoto('light')}
              >
                <img
                  src="/demo-images/street-light.jpg"
                  alt="Street Light"
                  style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>Damaged Light</span>
              </button>

              <button
                type="button"
                className="card"
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: attachments.some((a) => a.name.includes('waste'))
                    ? 'var(--brand-primary)'
                    : 'var(--border-subtle)',
                }}
                onClick={() => handleSelectDemoPhoto('waste')}
              >
                <img
                  src="/demo-images/waste-dump.jpg"
                  alt="Waste Overflow"
                  style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>Waste Dump</span>
              </button>
            </div>
          </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step3-next"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Immediate Danger & Safety */}
      {currentStep === 4 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                Is anyone in danger?
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Choose the answer that fits best.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'Is anyone in danger? Choose yes, no, or not sure.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div className="simple-choice-list" role="group" aria-label="Is anyone in danger?">
            {['Yes', 'No', 'Not sure'].map((answer) => <button key={answer} type="button" className={`simple-choice ${safetyNotes === answer ? 'selected' : ''}`} onClick={() => setSafetyNotes(answer)}>{answer}</button>)}
          </div>
          <details className="simple-optional-details">
            <summary>Add a note (optional)</summary>
            <textarea id="convo-safety-notes" className="form-textarea" placeholder="What danger do you see?" value={safetyNotes === 'Yes' || safetyNotes === 'No' || safetyNotes === 'Not sure' ? '' : safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} rows={2} />
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(3)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step4-next"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Citizen Contact & Privacy */}
      {currentStep === 5 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                Your phone number
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                We use it to send report updates.
              </p>
            </div>
            <button
              type="button"
              className="btn-speaker"
              onClick={() =>
                handleSpeak(
                  'Your contact details. We ask for a phone number so our team can provide updates. Email is optional.'
                )
              }
              title="Listen to this instruction"
              aria-label="Listen to step instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Privacy Guarantee Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid #10b981',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}
          >
            <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Your phone number is not shown on public pages.
            </p>
          </div>

          {/* Phone Number Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="convo-phone">
              Phone Number <span style={{ color: '#ef4444' }}>*</span> (Primary Contact):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-select"
                style={{ width: '130px', flexShrink: 0 }}
                value={citizenPhoneCountryCode}
                onChange={(e) => setCitizenPhoneCountryCode(e.target.value)}
                aria-label="Country Dial Code"
              >
                {COUNTRY_PHONE_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.code}
                  </option>
                ))}
              </select>
              <input
                id="convo-phone"
                type="tel"
                className="form-input"
                placeholder="Enter your phone number"
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                required
              />
            </div>
            {phoneError && (
              <span style={{ fontSize: '0.8rem', color: '#ef4444', display: 'block', marginTop: '0.35rem' }}>
                {phoneError}
              </span>
            )}
          </div>

          <details className="simple-optional-details">
            <summary>Email (optional)</summary>
          <div className="form-group">
            <label className="form-label" htmlFor="convo-email">
              Email <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <input
              id="convo-email"
              type="email"
              className="form-input"
              placeholder="e.g. name@example.com (not required)"
              value={citizenEmail}
              onChange={(e) => setCitizenEmail(e.target.value)}
            />
          </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(4)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              id="btn-convo-step5-next"
            >
              <span>Check report</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Final Submission */}
      {currentStep === 6 && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <h4 style={{ fontSize: '1.2rem' }}>Review Your Civic Grievance</h4>
            </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Check your report before sending.</p>
          </div>

          <div className="simple-review-card">
            <strong>{category === 'other' ? customCategoryDescription : category}</strong>
            <p>{description}</p>
            <span>{locationAddress || 'Location not added'}</span>
          </div>
          <details className="simple-optional-details">
            <summary>More details</summary>
          {/* Explainable Triage Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: `1.5px solid ${
                triagePreview.suggestedSeverity === 'critical'
                  ? 'var(--urgency-critical-border)'
                  : triagePreview.suggestedSeverity === 'high'
                  ? 'var(--urgency-high-border)'
                  : 'var(--brand-primary)'
              }`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Suggested team
                </span>
                <h4 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>
                  Target Authority: {triagePreview.suggestedAuthorityName}
                </h4>
              </div>
              <span className={`badge badge-${triagePreview.suggestedSeverity}`}>
                Severity: {triagePreview.suggestedSeverity.toUpperCase()} ({triagePreview.immediateDangerScore}/100)
              </span>
            </div>

            {/* Temporary Precaution Guidance */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '4px solid var(--brand-primary)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ display: 'block', color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>
                Temporary Precaution Guidance (Informational only • Not an official emergency service):
              </strong>
              {triagePreview.safetyGuidance}
            </div>
          </div>

          {/* Summary Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</span>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {category === 'other' ? `Other: ${customCategoryDescription || 'Custom Issue'}` : category.toUpperCase()}
              </p>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</span>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {locationAddress || 'Downtown Metro Area'} ({locationZone})
              </p>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact (Private)</span>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {citizenPhoneCountryCode} {citizenPhone}
              </p>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photo</span>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {attachments.length > 0 ? attachments[0].name : 'None (Optional)'}
              </p>
            </div>
          </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>Save draft</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(5)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            </div>
            <button
              type="button"
              className="btn btn-accent btn-lg"
              onClick={handleSubmit}
              id="btn-convo-submit"
            >
              <Send size={18} />
              <span>Send report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
