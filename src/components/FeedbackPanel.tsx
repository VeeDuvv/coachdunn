import { motion, AnimatePresence } from 'framer-motion';
import type { FeedbackItem, ExerciseState } from '../types/pose';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface FeedbackPanelProps {
  exerciseState: ExerciseState;
  isDetecting: boolean;
}

export function FeedbackPanel({ exerciseState, isDetecting }: FeedbackPanelProps) {
  const { repCount, formScore, feedback, phase } = exerciseState;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Form';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Keep Trying';
  };

  const getSeverityIcon = (severity: FeedbackItem['severity']) => {
    switch (severity) {
      case 'good':
        return <CheckCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'error':
        return <XCircle size={16} />;
    }
  };

  return (
    <div className="feedback-panel">
      {/* Rep Counter */}
      <motion.div 
        className="rep-counter"
        key={repCount}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        <span className="rep-number">{repCount}</span>
        <span className="rep-label">REPS</span>
      </motion.div>

      {/* Phase Indicator */}
      <div className="phase-indicator">
        <Activity className={`phase-icon ${isDetecting ? 'active' : ''}`} />
        <span className="phase-text">
          {!isDetecting ? 'Ready' : phase.toUpperCase()}
        </span>
      </div>

      {/* Form Score */}
      <div className="form-score">
        <div className="score-ring">
          <svg viewBox="0 0 100 100">
            <circle
              className="score-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <motion.circle
              className="score-progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              style={{ stroke: getScoreColor(formScore) }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: formScore / 100 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              transform="rotate(-90 50 50)"
              strokeDasharray="283"
            />
          </svg>
          <div className="score-value">
            <span className="score-number" style={{ color: getScoreColor(formScore) }}>
              {formScore}
            </span>
            <span className="score-percent">%</span>
          </div>
        </div>
        <span className="score-label" style={{ color: getScoreColor(formScore) }}>
          {getScoreLabel(formScore)}
        </span>
      </div>

      {/* Feedback Items */}
      <div className="feedback-list">
        <AnimatePresence mode="popLayout">
          {feedback.slice(0, 4).map((item) => (
            <motion.div
              key={item.id}
              className={`feedback-item ${item.severity}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <span className="feedback-icon">{getSeverityIcon(item.severity)}</span>
              <span className="feedback-message">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

