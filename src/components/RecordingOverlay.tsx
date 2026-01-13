import { motion } from "framer-motion";
import { Circle, Square } from "lucide-react";
import type { ExerciseType } from "../types/pose";
import { EXERCISE_CONFIGS } from "../utils/formAnalysis";

interface RecordingOverlayProps {
  exerciseType: ExerciseType;
  repCount: number;
  isRecording: boolean;
  duration: number;
  onStop: () => void;
}

export function RecordingOverlay({
  exerciseType,
  repCount,
  isRecording,
  duration,
  onStop,
}: RecordingOverlayProps) {
  const config = EXERCISE_CONFIGS[exerciseType];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="recording-overlay">
      {/* Recording indicator - top left */}
      <motion.div
        className="recording-indicator"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <motion.div
          className="rec-dot"
          animate={{ opacity: isRecording ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="rec-text">REC</span>
        <span className="rec-time">{formatTime(duration)}</span>
      </motion.div>

      {/* Exercise badge - top right */}
      <div className="exercise-badge-minimal">
        <span>{config.icon}</span>
        <span>{config.name}</span>
      </div>

      {/* Large rep counter - center */}
      <motion.div
        className="rep-counter-large"
        key={repCount}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.25 }}
      >
        <span className="rep-number-large">{repCount}</span>
        <span className="rep-label-large">REPS</span>
      </motion.div>

      {/* Stop button - bottom center */}
      <motion.button
        className="stop-recording-button"
        onClick={onStop}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Square size={20} fill="currentColor" />
        <span>Finish Set</span>
      </motion.button>

      {/* Subtle instruction */}
      <p className="recording-hint">
        Keep going! We'll analyze your form after you finish.
      </p>
    </div>
  );
}

