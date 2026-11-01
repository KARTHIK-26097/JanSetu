import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, MessageSquareText } from 'lucide-react';
import {
  getSiteFeedback,
  markSiteFeedbackReviewed,
  subscribeToSiteFeedback,
  type SiteFeedback,
} from '../../services/feedbackService';

interface CitizenFeedbackInboxProps {
  onBack: () => void;
}

export const CitizenFeedbackInbox: React.FC<CitizenFeedbackInboxProps> = ({ onBack }) => {
  const [feedback, setFeedback] = useState<SiteFeedback[]>(getSiteFeedback);

  useEffect(() => subscribeToSiteFeedback(() => setFeedback(getSiteFeedback())), []);

  return <section className="card handler-feedback-inbox" aria-labelledby="citizen-feedback-title">
    <div className="handler-feedback-heading">
      <div>
        <h2 id="citizen-feedback-title"><MessageSquareText size={23} /> Citizen feedback</h2>
        <p>Feedback sent from the Citizen Portal.</p>
      </div>
      <button type="button" className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back to cases</button>
    </div>

    {feedback.length === 0 ? <div className="empty-state">
      <MessageSquareText size={28} aria-hidden="true" />
      <h3>No feedback yet</h3>
      <p>New citizen feedback will appear here.</p>
    </div> : <div className="handler-feedback-list">
      {feedback.map((item) => <article key={item.id} className={`card handler-feedback-item ${item.reviewedAt ? 'reviewed' : 'new'}`}>
        <div className="handler-feedback-item-top">
          <span className={`badge ${item.reviewedAt ? 'badge-low' : 'badge-high'}`}>
            {item.reviewedAt ? <><CheckCircle2 size={13} /> Reviewed</> : <><Clock3 size={13} /> New</>}
          </span>
          <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
        </div>
        <p className="handler-feedback-comment">{item.comment}</p>
        {!item.reviewedAt && <button type="button" className="btn btn-secondary btn-sm" onClick={() => markSiteFeedbackReviewed(item.id)}>
          <CheckCircle2 size={15} /> Mark reviewed
        </button>}
      </article>)}
    </div>}
  </section>;
};
