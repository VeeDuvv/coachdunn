import { motion } from 'framer-motion';
import type { ExerciseType } from '../types/pose';
import { EXERCISE_CONFIGS } from '../utils/formAnalysis';

interface ExerciseSelectorProps {
  selectedExercise: ExerciseType;
  onSelect: (exercise: ExerciseType) => void;
  disabled?: boolean;
}

export function ExerciseSelector({ selectedExercise, onSelect, disabled }: ExerciseSelectorProps) {
  const exercises = Object.entries(EXERCISE_CONFIGS) as [ExerciseType, typeof EXERCISE_CONFIGS[ExerciseType]][];

  return (
    <div className="exercise-selector">
      <h3 className="selector-title">Select Exercise</h3>
      <div className="exercise-grid">
        {exercises.map(([type, config]) => (
          <motion.button
            key={type}
            className={`exercise-button ${selectedExercise === type ? 'active' : ''}`}
            onClick={() => onSelect(type)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <span className="exercise-icon">{config.icon}</span>
            <span className="exercise-name">{config.name}</span>
          </motion.button>
        ))}
      </div>
      <p className="exercise-hint">{EXERCISE_CONFIGS[selectedExercise].description}</p>
    </div>
  );
}

