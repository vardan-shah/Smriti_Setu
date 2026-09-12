// A genuine reinforcement-learning approach to difficulty selection:
// a contextual multi-armed bandit that learns, per device/patient,
// which difficulty level (4, 6, or 8 pairs) produces the most
// appropriate cognitive challenge -- entirely from sessions already
// saved locally in IndexedDB. No training dataset, no server, no ML
// runtime needed -- it replaces the single-last-session threshold
// rule with an online value-estimation policy (epsilon-greedy over
// incrementally updated Q-values), which is the standard formulation
// for exactly this class of problem.

import { GameSession } from "../app/utils/db";

export const DIFFICULTY_ARMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export type DifficultyArm = (typeof DIFFICULTY_ARMS)[number];

const LEARNING_RATE = 0.3; // how fast Q-values move toward new evidence
const EXPLORATION_RATE = 0.15; // ~15% of sessions deliberately try a non-greedy arm
const TARGET_ACCURACY_LOW = 60; // below this: too hard, frustration risk
const TARGET_ACCURACY_HIGH = 88; // above this: too easy, little cognitive demand
const HIGH_HESITATION_MS = 6000; // very long pre-first-click pause

/**
 * Reward for one completed session, in [0, 1]. Peaks when accuracy
 * sits in the "productive challenge" zone; penalized when too easy
 * (no cognitive stretch) or too hard (frustration) -- the standard
 * "flow channel" framing from cognitive-training literature, not
 * just "did they win."
 */
export function computeReward(session: GameSession): number {
  const { accuracy } = session;
  let reward: number;

  if (accuracy < TARGET_ACCURACY_LOW) {
    reward = Math.max(0, accuracy / TARGET_ACCURACY_LOW) * 0.5;
  } else if (accuracy > TARGET_ACCURACY_HIGH) {
    reward = 0.6;
  } else {
    const span = TARGET_ACCURACY_HIGH - TARGET_ACCURACY_LOW;
    reward = 0.6 + 0.4 * ((accuracy - TARGET_ACCURACY_LOW) / span);
  }

  const hesitation = session.biomarkers?.hesitationMs ?? 0;
  if (hesitation > HIGH_HESITATION_MS) reward *= 0.8;

  return Math.max(0, Math.min(1, reward));
}

interface ArmStats {
  qValue: number;
  count: number;
}

function isDifficultyArm(n: number): n is DifficultyArm {
  return (DIFFICULTY_ARMS as readonly number[]).includes(n);
}

/**
 * Replays session history into current per-arm value estimates.
 * This *is* the learning step -- cheap enough to redo from scratch
 * each time rather than persisting incremental state separately.
 */
export function computeArmValues(
  sessions: GameSession[]
): Record<DifficultyArm, ArmStats> {
  const stats = Object.fromEntries(
    DIFFICULTY_ARMS.map(arm => [arm, { qValue: 0.5, count: 0 }])
  ) as Record<DifficultyArm, ArmStats>;

  for (const session of sessions) {
    if (!isDifficultyArm(session.matches)) continue; // ignore malformed/legacy rows safely
    const arm = session.matches;
    const reward = computeReward(session);
    const s = stats[arm];
    s.qValue = s.qValue + LEARNING_RATE * (reward - s.qValue); // Q ← Q + α(reward − Q)
    s.count += 1;
  }

  return stats;
}

/**
 * Epsilon-greedy selection: usually pick the best-estimated arm, but
 * occasionally try a different one on purpose. Keeps the policy
 * adapting if the patient's ability changes over time -- improvement
 * *or* decline -- instead of locking onto whatever looked best after
 * a handful of sessions. That matters here specifically because
 * tracking change over time is the app's actual clinical purpose.
 */
export function selectDifficulty(sessions: GameSession[]): DifficultyArm {
  if (sessions.length === 0) return 6;

  const stats = computeArmValues(sessions);

  const unexplored = DIFFICULTY_ARMS.filter((arm) => stats[arm].count === 0);
  if (unexplored.length > 0) {
    return unexplored[Math.floor(Math.random() * unexplored.length)];
  }

  if (Math.random() < EXPLORATION_RATE) {
    return DIFFICULTY_ARMS[Math.floor(Math.random() * DIFFICULTY_ARMS.length)];
  }

  return DIFFICULTY_ARMS.reduce((best, arm) =>
    stats[arm].qValue > stats[best].qValue ? arm : best
  );
}
