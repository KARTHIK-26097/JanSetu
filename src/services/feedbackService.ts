export interface SiteFeedback {
  id: string;
  comment: string;
  createdAt: string;
  reviewedAt?: string;
}

const FEEDBACK_STORAGE_KEY = 'civicvoice_site_feedback';
const FEEDBACK_EVENT = 'civicvoice:site-feedback-updated';

export function getSiteFeedback(): SiteFeedback[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SiteFeedback =>
      !!item && typeof item.id === 'string' && typeof item.comment === 'string' && typeof item.createdAt === 'string'
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function notifyFeedbackChanged() {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT));
}

export function submitSiteFeedback(comment: string): SiteFeedback {
  const cleaned = comment.trim();
  if (!cleaned) throw new Error('Feedback cannot be empty.');

  const feedback: SiteFeedback = {
    id: `FB-${Date.now().toString(36).toUpperCase()}`,
    comment: cleaned,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify([feedback, ...getSiteFeedback()]));
  notifyFeedbackChanged();
  return feedback;
}

export function markSiteFeedbackReviewed(feedbackId: string): void {
  const feedback = getSiteFeedback().map((item) => item.id === feedbackId
    ? { ...item, reviewedAt: item.reviewedAt || new Date().toISOString() }
    : item
  );
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
  notifyFeedbackChanged();
}

export function subscribeToSiteFeedback(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FEEDBACK_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(FEEDBACK_EVENT, listener);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(FEEDBACK_EVENT, listener);
  };
}
