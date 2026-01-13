import type {
  SetRecording,
  SetAnalysis,
  IssueAnalysis,
  Recommendation,
  JointAngles,
  ExerciseType,
} from "../types/pose";

// Body part display names
const BODY_PART_NAMES: Record<keyof JointAngles, string> = {
  leftElbow: "Left Elbow",
  rightElbow: "Right Elbow",
  leftKnee: "Left Knee",
  rightKnee: "Right Knee",
  leftHip: "Left Hip",
  rightHip: "Right Hip",
  leftShoulder: "Left Shoulder",
  rightShoulder: "Right Shoulder",
  spine: "Spine/Back",
};

// Exercise-specific recommendations
const EXERCISE_RECOMMENDATIONS: Record<
  ExerciseType,
  Record<keyof JointAngles, { title: string; description: string; tip: string }>
> = {
  squat: {
    leftKnee: {
      title: "Knee Alignment",
      description: "Your left knee is not reaching proper depth or is caving inward.",
      tip: "Focus on pushing your knees out over your toes. Try box squats to learn proper depth.",
    },
    rightKnee: {
      title: "Knee Alignment",
      description: "Your right knee is not reaching proper depth or is caving inward.",
      tip: "Focus on pushing your knees out over your toes. Try box squats to learn proper depth.",
    },
    leftHip: {
      title: "Hip Mobility",
      description: "Your left hip isn't hinging properly during the squat.",
      tip: "Work on hip mobility with hip circles and deep squat holds. Sit back into your heels.",
    },
    rightHip: {
      title: "Hip Mobility",
      description: "Your right hip isn't hinging properly during the squat.",
      tip: "Work on hip mobility with hip circles and deep squat holds. Sit back into your heels.",
    },
    spine: {
      title: "Back Position",
      description: "Your back is rounding during the squat.",
      tip: "Keep your chest up and core tight. Look slightly upward to help maintain a neutral spine.",
    },
    leftElbow: { title: "", description: "", tip: "" },
    rightElbow: { title: "", description: "", tip: "" },
    leftShoulder: { title: "", description: "", tip: "" },
    rightShoulder: { title: "", description: "", tip: "" },
  },
  pushup: {
    leftElbow: {
      title: "Elbow Position",
      description: "Your left elbow is flaring out too much or not bending enough.",
      tip: "Keep elbows at 45° angle to your body, not straight out. Go lower if you can.",
    },
    rightElbow: {
      title: "Elbow Position",
      description: "Your right elbow is flaring out too much or not bending enough.",
      tip: "Keep elbows at 45° angle to your body, not straight out. Go lower if you can.",
    },
    spine: {
      title: "Core Engagement",
      description: "Your hips are sagging or piking during the pushup.",
      tip: "Squeeze your glutes and core to maintain a straight line from head to heels.",
    },
    leftHip: {
      title: "Hip Alignment",
      description: "Your hips are not staying level during the movement.",
      tip: "Engage your core and think about making your body into a rigid plank.",
    },
    rightHip: {
      title: "Hip Alignment",
      description: "Your hips are not staying level during the movement.",
      tip: "Engage your core and think about making your body into a rigid plank.",
    },
    leftKnee: { title: "", description: "", tip: "" },
    rightKnee: { title: "", description: "", tip: "" },
    leftShoulder: { title: "", description: "", tip: "" },
    rightShoulder: { title: "", description: "", tip: "" },
  },
  lunge: {
    leftKnee: {
      title: "Front Knee Angle",
      description: "Your front knee isn't reaching 90° or is going past your toes.",
      tip: "Step further forward and sink straight down. Your knee should track over your ankle.",
    },
    rightKnee: {
      title: "Front Knee Angle",
      description: "Your front knee isn't reaching 90° or is going past your toes.",
      tip: "Step further forward and sink straight down. Your knee should track over your ankle.",
    },
    spine: {
      title: "Torso Position",
      description: "You're leaning too far forward during the lunge.",
      tip: "Keep your torso upright and look straight ahead. Engage your core for stability.",
    },
    leftHip: { title: "", description: "", tip: "" },
    rightHip: { title: "", description: "", tip: "" },
    leftElbow: { title: "", description: "", tip: "" },
    rightElbow: { title: "", description: "", tip: "" },
    leftShoulder: { title: "", description: "", tip: "" },
    rightShoulder: { title: "", description: "", tip: "" },
  },
  plank: {
    spine: {
      title: "Spine Alignment",
      description: "Your back is not staying straight during the plank.",
      tip: "Imagine a straight line from your head to your heels. Don't let your hips sag or pike.",
    },
    leftHip: {
      title: "Hip Position",
      description: "Your hips are dropping or rising too much.",
      tip: "Squeeze your glutes and tuck your pelvis slightly to engage your core.",
    },
    rightHip: {
      title: "Hip Position",
      description: "Your hips are dropping or rising too much.",
      tip: "Squeeze your glutes and tuck your pelvis slightly to engage your core.",
    },
    leftElbow: {
      title: "Arm Position",
      description: "Your elbows aren't positioned correctly under your shoulders.",
      tip: "Place elbows directly under shoulders, forearms parallel, pressing firmly into the ground.",
    },
    rightElbow: {
      title: "Arm Position",
      description: "Your elbows aren't positioned correctly under your shoulders.",
      tip: "Place elbows directly under shoulders, forearms parallel, pressing firmly into the ground.",
    },
    leftKnee: { title: "", description: "", tip: "" },
    rightKnee: { title: "", description: "", tip: "" },
    leftShoulder: { title: "", description: "", tip: "" },
    rightShoulder: { title: "", description: "", tip: "" },
  },
  jumpingJack: {
    leftShoulder: {
      title: "Arm Extension",
      description: "Your left arm isn't reaching full extension overhead.",
      tip: "Reach your arms all the way up until they nearly touch above your head.",
    },
    rightShoulder: {
      title: "Arm Extension",
      description: "Your right arm isn't reaching full extension overhead.",
      tip: "Reach your arms all the way up until they nearly touch above your head.",
    },
    leftHip: {
      title: "Leg Spread",
      description: "Your legs aren't spreading wide enough during the jump.",
      tip: "Jump your feet out wider than shoulder-width. Land softly on the balls of your feet.",
    },
    rightHip: {
      title: "Leg Spread",
      description: "Your legs aren't spreading wide enough during the jump.",
      tip: "Jump your feet out wider than shoulder-width. Land softly on the balls of your feet.",
    },
    leftKnee: { title: "", description: "", tip: "" },
    rightKnee: { title: "", description: "", tip: "" },
    leftElbow: { title: "", description: "", tip: "" },
    rightElbow: { title: "", description: "", tip: "" },
    spine: { title: "", description: "", tip: "" },
  },
};

export function analyzeSet(recording: SetRecording): SetAnalysis {
  const { reps, exerciseType, startTime, endTime } = recording;

  if (reps.length === 0) {
    return {
      totalReps: 0,
      duration: 0,
      averageFormScore: 0,
      bestRep: 0,
      worstRep: 0,
      commonIssues: [],
      recommendations: [],
      overallGrade: "F",
    };
  }

  // Calculate basic stats
  const totalReps = reps.length;
  const duration = endTime ? (endTime - startTime) / 1000 : 0;
  const formScores = reps.map((r) => r.formScore);
  const averageFormScore = Math.round(
    formScores.reduce((a, b) => a + b, 0) / totalReps
  );

  // Find best and worst reps
  const bestRep = reps.reduce(
    (best, rep) => (rep.formScore > best.formScore ? rep : best),
    reps[0]
  ).repNumber;
  const worstRep = reps.reduce(
    (worst, rep) => (rep.formScore < worst.formScore ? rep : worst),
    reps[0]
  ).repNumber;

  // Analyze common issues
  const issueMap = new Map<keyof JointAngles, { count: number; totalDeviation: number }>();

  reps.forEach((rep) => {
    rep.issues.forEach((issue) => {
      const existing = issueMap.get(issue.bodyPart) || { count: 0, totalDeviation: 0 };
      issueMap.set(issue.bodyPart, {
        count: existing.count + 1,
        totalDeviation: existing.totalDeviation + issue.deviation,
      });
    });
  });

  const commonIssues: IssueAnalysis[] = Array.from(issueMap.entries())
    .map(([bodyPart, data]) => ({
      bodyPart,
      occurrences: data.count,
      percentageOfReps: Math.round((data.count / totalReps) * 100),
      averageDeviation: Math.round(data.totalDeviation / data.count),
      description: `${BODY_PART_NAMES[bodyPart]} had issues in ${data.count} of ${totalReps} reps`,
    }))
    .filter((issue) => issue.percentageOfReps >= 25) // Only show issues occurring in 25%+ of reps
    .sort((a, b) => b.percentageOfReps - a.percentageOfReps);

  // Generate recommendations based on issues
  const recommendations: Recommendation[] = commonIssues
    .slice(0, 3) // Top 3 issues
    .map((issue, index) => {
      const rec = EXERCISE_RECOMMENDATIONS[exerciseType][issue.bodyPart];
      if (!rec.title) return null;

      return {
        id: `rec-${index}`,
        priority: issue.percentageOfReps >= 75 ? "high" : issue.percentageOfReps >= 50 ? "medium" : "low",
        title: rec.title,
        description: rec.description,
        tip: rec.tip,
      } as Recommendation;
    })
    .filter((r): r is Recommendation => r !== null);

  // Calculate overall grade
  const overallGrade = getGrade(averageFormScore);

  return {
    totalReps,
    duration,
    averageFormScore,
    bestRep,
    worstRep,
    commonIssues,
    recommendations,
    overallGrade,
  };
}

function getGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function getGradeColor(grade: "A" | "B" | "C" | "D" | "F"): string {
  switch (grade) {
    case "A":
      return "var(--color-success)";
    case "B":
      return "#88ff00";
    case "C":
      return "var(--color-warning)";
    case "D":
      return "#ff8800";
    case "F":
      return "var(--color-error)";
  }
}

export function getPriorityColor(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "var(--color-error)";
    case "medium":
      return "var(--color-warning)";
    case "low":
      return "var(--color-primary)";
  }
}

