import Phaser from '../../lib/phaser.js';
import { DIRECTION } from '../../common/direction.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys.js';

const PANEL = { x: 0, y: 336, width: 1024, height: 240 };
const OPTION = { width: 468, height: 60 };
const COL_X = [30, 526]; // left/right column x
const ROW_Y = [430, 502]; // top/bottom row y

const COLOR = {
  panelFill: 0x0c1a2a,
  optionFill: 0x1b2a3a,
  optionBorder: 0x486a82,
  selectedFill: 0x24435c,
  selectedBorder: 0xffd166,
  correctFill: 0x2e7d46,
  correctBorder: 0x7be0a0,
  wrongFill: 0x7d2e2e,
  wrongBorder: 0xe08a8a,
  timer: 0x64d0ff,
  timerDanger: 0xff6b6b,
};

/**
 * Phaser-native quiz panel shown during the player's battle turn. Renders the
 * question, four answer options (navigable with the joystick/arrows + confirm,
 * or tappable directly), a countdown bar, and correct/wrong feedback.
 *
 * The panel reads input state through the battle scene (which already merges
 * keyboard + touch via the Controls class), so it works on desktop and mobile.
 */
export class QuizUI {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {Phaser.GameObjects.Text} */
  #questionText;
  /** @type {Phaser.GameObjects.Text} */
  #metaText;
  /** @type {Phaser.GameObjects.Rectangle} */
  #timerFill;
  /** @type {Phaser.GameObjects.Rectangle[]} */
  #optionRects;
  /** @type {Phaser.GameObjects.Text[]} */
  #optionLabels;
  /** @type {number} */
  #selectedIndex;
  /** @type {boolean} */
  #locked;
  /** @type {(index: number) => void} */
  #onPick;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.#scene = scene;
    this.#selectedIndex = 0;
    this.#locked = true;
    this.#onPick = () => {};
    this.#optionRects = [];
    this.#optionLabels = [];
    this.#build();
    this.#container.setVisible(false);
  }

  /** @type {number} the option index the cursor is currently on */
  get selectedIndex() {
    return this.#selectedIndex;
  }

  #build() {
    const scene = this.#scene;
    this.#container = scene.add.container(0, 0).setDepth(100);

    const panel = scene.add
      .rectangle(PANEL.x, PANEL.y, PANEL.width, PANEL.height, COLOR.panelFill, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.optionBorder);
    this.#container.add(panel);

    this.#metaText = scene.add
      .text(PANEL.width - 20, PANEL.y + 12, '', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        fontSize: '16px',
        color: '#9fc0d6',
      })
      .setOrigin(1, 0);
    this.#container.add(this.#metaText);

    this.#questionText = scene.add
      .text(PANEL.width / 2, PANEL.y + 40, '', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: PANEL.width - 80 },
      })
      .setOrigin(0.5, 0);
    this.#container.add(this.#questionText);

    // countdown bar
    const timerBg = scene.add
      .rectangle(32, PANEL.y + 78, PANEL.width - 64, 8, 0x000000, 0.4)
      .setOrigin(0, 0.5);
    this.#timerFill = scene.add
      .rectangle(32, PANEL.y + 78, PANEL.width - 64, 8, COLOR.timer, 1)
      .setOrigin(0, 0.5);
    this.#container.add(timerBg);
    this.#container.add(this.#timerFill);

    // four option boxes in a 2x2 grid
    for (let i = 0; i < 4; i++) {
      const x = COL_X[i % 2];
      const y = ROW_Y[Math.floor(i / 2)];
      const rect = scene.add
        .rectangle(x, y, OPTION.width, OPTION.height, COLOR.optionFill, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLOR.optionBorder)
        .setInteractive({ useHandCursor: true });
      rect.on(Phaser.Input.Events.POINTER_OVER, () => {
        if (!this.#locked) this.#setSelected(i);
      });
      rect.on(Phaser.Input.Events.POINTER_DOWN, () => {
        if (this.#locked) return;
        this.#setSelected(i);
        this.#onPick(i);
      });
      const label = scene.add
        .text(x + 18, y + OPTION.height / 2, '', {
          fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
          fontSize: '20px',
          color: '#eaf3fb',
          wordWrap: { width: OPTION.width - 36 },
        })
        .setOrigin(0, 0.5);
      this.#optionRects.push(rect);
      this.#optionLabels.push(label);
      this.#container.add(rect);
      this.#container.add(label);
    }
  }

  /**
   * Display a question and begin accepting input.
   * @param {import('./quiz-manager.js').QuizQuestion} question
   * @param {object} meta
   * @param {number} meta.streak
   * @param {(index: number) => void} onPick called when the player taps an option
   */
  show(question, meta, onPick) {
    this.#onPick = onPick;
    this.#locked = false;
    this.#selectedIndex = 0;
    this.#questionText.setText(question.question);
    this.#metaText.setText(`${question.category}  ·  Tier ${question.difficulty}  ·  Streak x${meta.streak}`);
    question.answers.forEach((answer, i) => {
      this.#optionLabels[i].setText(`${i + 1})  ${answer}`);
      this.#optionRects[i].setFillStyle(COLOR.optionFill, 0.95).setStrokeStyle(2, COLOR.optionBorder);
    });
    this.setTimerFraction(1);
    this.#setSelected(0);
    this.#container.setVisible(true);
  }

  /** @param {import('../../common/direction.js').Direction} direction */
  moveCursor(direction) {
    if (this.#locked) return;
    const col = this.#selectedIndex % 2;
    const row = Math.floor(this.#selectedIndex / 2);
    let next = this.#selectedIndex;
    if (direction === DIRECTION.LEFT && col === 1) next -= 1;
    else if (direction === DIRECTION.RIGHT && col === 0) next += 1;
    else if (direction === DIRECTION.UP && row === 1) next -= 2;
    else if (direction === DIRECTION.DOWN && row === 0) next += 2;
    this.#setSelected(next);
  }

  #setSelected(index) {
    this.#selectedIndex = index;
    this.#optionRects.forEach((rect, i) => {
      if (i === index) {
        rect.setFillStyle(COLOR.selectedFill, 1).setStrokeStyle(3, COLOR.selectedBorder);
      } else {
        rect.setFillStyle(COLOR.optionFill, 0.95).setStrokeStyle(2, COLOR.optionBorder);
      }
    });
  }

  /** @param {number} fraction 0-1 of time remaining */
  setTimerFraction(fraction) {
    const clamped = Phaser.Math.Clamp(fraction, 0, 1);
    // the fill is full-width with a left origin, so scaleX shrinks it from the right
    this.#timerFill.scaleX = clamped;
    this.#timerFill.setFillStyle(clamped < 0.33 ? COLOR.timerDanger : COLOR.timer, 1);
  }

  /**
   * Lock input and color the correct answer (and the wrong pick, if any).
   * @param {number} correctIndex
   * @param {number} chosenIndex -1 on timeout
   */
  reveal(correctIndex, chosenIndex) {
    this.#locked = true;
    this.#optionRects[correctIndex].setFillStyle(COLOR.correctFill, 1).setStrokeStyle(3, COLOR.correctBorder);
    if (chosenIndex >= 0 && chosenIndex !== correctIndex) {
      this.#optionRects[chosenIndex].setFillStyle(COLOR.wrongFill, 1).setStrokeStyle(3, COLOR.wrongBorder);
    }
  }

  hide() {
    this.#locked = true;
    this.#container.setVisible(false);
  }
}
