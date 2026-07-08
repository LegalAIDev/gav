import Phaser from '../../lib/phaser.js';
import { DataUtils } from '../../utils/data-utils.js';

/**
 * @typedef QuizQuestion
 * @type {object}
 * @property {string} category    subject the question belongs to (e.g. "Math")
 * @property {number} difficulty  tier 1-3; higher tiers unlock as the monster levels up
 * @property {string} question    the prompt shown to the player
 * @property {string[]} answers   the multiple-choice options (4)
 * @property {number} correct     index into `answers` of the correct option
 */

/**
 * @typedef QuizResult
 * @type {object}
 * @property {boolean} correct
 * @property {number} correctIndex
 * @property {number} damage        damage the player's attack should deal (0 if wrong)
 * @property {number} multiplier    damage multiplier applied (for messaging)
 * @property {number} streak        current correct-answer streak after this answer
 */

// Tuning knobs for how answers translate into combat.
const STREAK_BONUS_PER = 0.15; // extra damage multiplier per streak level
const SPEED_BONUS_MAX = 0.5; // extra multiplier for answering instantly
const MAX_MULTIPLIER = 3;

/**
 * Owns quiz state for a single battle: which questions have been seen, the
 * current answer streak, and how a correct answer scales into attack damage.
 *
 * This is the extracted "QuizMon" combat concept — answering IS attacking —
 * kept as pure logic so the battle scene can drive the UI/turn flow.
 */
export class QuizManager {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {QuizQuestion[]} */
  #questions;
  /** @type {number} */
  #streak;
  /** @type {string[]} recently-used prompts, to avoid immediate repeats */
  #recent;

  /** @param {Phaser.Scene} scene the battle scene (used to read cached question data) */
  constructor(scene) {
    this.#scene = scene;
    this.#questions = DataUtils.getQuestions(scene) || [];
    this.#streak = 0;
    this.#recent = [];
  }

  /** @type {number} current correct-answer streak */
  get streak() {
    return this.#streak;
  }

  /**
   * Choose the next question, scaling difficulty with the active monster's level
   * and optionally filtering to a subject category (e.g. per overworld area).
   * @param {object} [options]
   * @param {number} [options.level] active player monster level (difficulty scaling)
   * @param {string} [options.category] restrict to a single subject if provided
   * @returns {QuizQuestion}
   */
  pickQuestion({ level = 1, category } = {}) {
    let pool = this.#questions;
    if (category) {
      const filtered = pool.filter((q) => q.category === category);
      if (filtered.length) pool = filtered;
    }

    // higher-level monsters face harder questions
    const difficultyCeiling = level < 6 ? 2 : 3;
    const tiered = pool.filter((q) => q.difficulty <= difficultyCeiling);
    if (tiered.length) pool = tiered;

    // avoid immediate repeats when the pool is large enough to allow it
    const fresh = pool.filter((q) => !this.#recent.includes(q.question));
    const usable = fresh.length ? fresh : pool;

    const question = Phaser.Utils.Array.GetRandom(usable);
    this.#recent.push(question.question);
    if (this.#recent.length > 6) this.#recent.shift();
    return question;
  }

  /**
   * Resolve the player's answer into a combat result.
   * @param {object} args
   * @param {QuizQuestion} args.question
   * @param {number} args.chosenIndex   the option the player picked (-1 on timeout)
   * @param {number} args.baseAttack     the active monster's attack stat
   * @param {number} args.timeFraction   fraction of the timer remaining (0-1); rewards speed
   * @returns {QuizResult}
   */
  resolveAnswer({ question, chosenIndex, baseAttack, timeFraction }) {
    const correct = chosenIndex === question.correct;

    if (!correct) {
      this.#streak = 0;
      return { correct: false, correctIndex: question.correct, damage: 0, multiplier: 0, streak: 0 };
    }

    this.#streak += 1;
    const clampedTime = Phaser.Math.Clamp(timeFraction, 0, 1);
    const multiplier = Math.min(
      MAX_MULTIPLIER,
      1 + STREAK_BONUS_PER * (this.#streak - 1) + SPEED_BONUS_MAX * clampedTime
    );
    const damage = Math.max(1, Math.round(baseAttack * multiplier));
    return { correct: true, correctIndex: question.correct, damage, multiplier, streak: this.#streak };
  }
}
