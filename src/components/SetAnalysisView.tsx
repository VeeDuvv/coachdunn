import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Repeat,
  Share2,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import type { SetAnalysis, SetRecording, ExerciseType } from "../types/pose";
import {
  formatDuration,
  getGradeColor,
  getPriorityColor,
} from "../utils/setAnalysis";
import { EXERCISE_CONFIGS } from "../utils/formAnalysis";

interface SetAnalysisViewProps {
  recording: SetRecording;
  analysis: SetAnalysis;
  onNewSet: () => void;
  onBackToMenu: () => void;
}

export function SetAnalysisView({
  recording,
  analysis,
  onNewSet,
  onBackToMenu,
}: SetAnalysisViewProps) {
  const exerciseConfig = EXERCISE_CONFIGS[recording.exerciseType];
  const gradeColor = getGradeColor(analysis.overallGrade);

  const handleShare = async () => {
    const shareText = `🏋️ CoachDunn Workout Report
    
Exercise: ${exerciseConfig.name}
Reps: ${analysis.totalReps}
Grade: ${analysis.overallGrade}
Form Score: ${analysis.averageFormScore}%
Duration: ${formatDuration(analysis.duration)}

${analysis.recommendations.length > 0 ? "Top tip: " + analysis.recommendations[0].tip : "Great form! Keep it up!"}

Train smarter with CoachDunn - Your AI Exercise Buddy`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CoachDunn Workout Report",
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Results copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <motion.div
      className="analysis-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <div className="analysis-header">
        <div className="analysis-exercise">
          <span className="exercise-icon-large">{exerciseConfig.icon}</span>
          <div>
            <h2>{exerciseConfig.name} Complete!</h2>
            <p className="analysis-subtitle">Here's how you did</p>
          </div>
        </div>
      </div>

      {/* Grade Card */}
      <motion.div
        className="grade-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <div className="grade-circle" style={{ borderColor: gradeColor }}>
          <span className="grade-letter" style={{ color: gradeColor }}>
            {analysis.overallGrade}
          </span>
        </div>
        <div className="grade-details">
          <div className="grade-score">
            <span className="score-value">{analysis.averageFormScore}</span>
            <span className="score-label">% Form Score</span>
          </div>
          <p className="grade-message">{getGradeMessage(analysis.overallGrade)}</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Repeat className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{analysis.totalReps}</span>
            <span className="stat-label">Total Reps</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Clock className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatDuration(analysis.duration)}</span>
            <span className="stat-label">Duration</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Trophy className="stat-icon success" />
          <div className="stat-content">
            <span className="stat-value">Rep #{analysis.bestRep}</span>
            <span className="stat-label">Best Form</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Target className="stat-icon warning" />
          <div className="stat-content">
            <span className="stat-value">Rep #{analysis.worstRep}</span>
            <span className="stat-label">Needs Work</span>
          </div>
        </motion.div>
      </div>

      {/* Recommendations Section */}
      {analysis.recommendations.length > 0 && (
        <motion.div
          className="recommendations-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="section-title">
            <TrendingUp size={20} />
            Recommendations to Improve
          </h3>

          <div className="recommendations-list">
            {analysis.recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                className="recommendation-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div
                  className="rec-priority"
                  style={{ backgroundColor: getPriorityColor(rec.priority) }}
                >
                  {rec.priority === "high" ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
                <div className="rec-content">
                  <h4>{rec.title}</h4>
                  <p className="rec-description">{rec.description}</p>
                  <div className="rec-tip">
                    <CheckCircle size={14} />
                    <span>{rec.tip}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Issues - Great Job! */}
      {analysis.recommendations.length === 0 && analysis.totalReps > 0 && (
        <motion.div
          className="great-job-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Trophy className="great-job-icon" />
          <h3>Excellent Form!</h3>
          <p>Your technique was on point. Keep up the great work!</p>
        </motion.div>
      )}

      {/* Issue Breakdown */}
      {analysis.commonIssues.length > 0 && (
        <motion.div
          className="issues-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="section-title">Form Breakdown</h3>
          <div className="issues-list">
            {analysis.commonIssues.map((issue) => (
              <div key={issue.bodyPart} className="issue-bar">
                <div className="issue-label">
                  <span>{issue.description}</span>
                  <span className="issue-percent">{issue.percentageOfReps}%</span>
                </div>
                <div className="issue-progress">
                  <motion.div
                    className="issue-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${issue.percentageOfReps}%` }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{
                      backgroundColor:
                        issue.percentageOfReps >= 75
                          ? "var(--color-error)"
                          : issue.percentageOfReps >= 50
                          ? "var(--color-warning)"
                          : "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="analysis-actions">
        <motion.button
          className="action-button primary"
          onClick={onNewSet}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw size={20} />
          <span>New Set</span>
        </motion.button>

        <motion.button
          className="action-button secondary"
          onClick={handleShare}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 size={20} />
          <span>Share Results</span>
        </motion.button>
      </div>

      <button className="back-link" onClick={onBackToMenu}>
        ← Back to Exercise Selection
      </button>
    </motion.div>
  );
}

function getGradeMessage(grade: "A" | "B" | "C" | "D" | "F"): string {
  switch (grade) {
    case "A":
      return "Outstanding! Your form is excellent.";
    case "B":
      return "Great work! Minor adjustments will perfect your form.";
    case "C":
      return "Good effort! Focus on the recommendations below.";
    case "D":
      return "Keep practicing! Review the tips to improve.";
    case "F":
      return "Let's work on this together. Check the guidance below.";
  }
}

