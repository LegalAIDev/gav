import Phaser from '../lib/phaser.js';
import { DIRECTION } from '../common/direction.js';
import { touchInput, TOUCH_BUTTON } from './touch-input.js';

export class Controls {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys | undefined} */
  #cursorKeys;
  /** @type {boolean} */
  #lockPlayerInput;
  /** @type {Phaser.Input.Keyboard.Key | undefined} */
  #enterKey;
  /** @type {Phaser.Input.Keyboard.Key | undefined} */
  #fKey;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the cursor keys will be created in
   */
  constructor(scene) {
    this.#scene = scene;
    this.#cursorKeys = this.#scene.input.keyboard?.createCursorKeys();
    this.#enterKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.#fKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.#lockPlayerInput = false;
    // Build the on-screen touch controls (idempotent). This makes every scene
    // that reads input through Controls playable on a touch device.
    touchInput.init();
  }

  /** @type {boolean} */
  get isInputLocked() {
    return this.#lockPlayerInput;
  }

  /** @param {boolean} val the value that will be assigned */
  set lockInput(val) {
    this.#lockPlayerInput = val;
  }

  /** @returns {boolean} */
  wasEnterKeyPressed() {
    const keyboard = this.#enterKey !== undefined && Phaser.Input.Keyboard.JustDown(this.#enterKey);
    // The on-screen Menu button has its own channel so it doesn't collide with
    // the A/confirm button (both used to route through CONFIRM, which meant the
    // overworld menu could never be opened by touch).
    return keyboard || touchInput.consumeButtonPressed(TOUCH_BUTTON.MENU);
  }

  /** @returns {boolean} */
  wasSpaceKeyPressed() {
    const keyboard = this.#cursorKeys !== undefined && Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);
    return keyboard || touchInput.consumeButtonPressed(TOUCH_BUTTON.CONFIRM);
  }

  /** @returns {boolean} */
  wasBackKeyPressed() {
    const keyboard = this.#cursorKeys !== undefined && Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift);
    return keyboard || touchInput.consumeButtonPressed(TOUCH_BUTTON.BACK);
  }

  /** @returns {boolean} */
  wasFKeyPressed() {
    const keyboard = this.#fKey !== undefined && Phaser.Input.Keyboard.JustDown(this.#fKey);
    return keyboard || touchInput.consumeButtonPressed(TOUCH_BUTTON.INTERACT);
  }

  /**
   * Returns whether the player is holding "run" — the keyboard shift key, or the
   * touch movement stick pushed to its outer edge.
   * @returns {boolean}
   */
  isShiftKeyDown() {
    const keyboard = this.#cursorKeys !== undefined && this.#cursorKeys.shift.isDown;
    return keyboard || touchInput.isRunning();
  }

  /** @returns {import('../common/direction.js').Direction} */
  getDirectionKeyJustPressed() {
    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE;
    if (this.#cursorKeys !== undefined) {
      if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
        selectedDirection = DIRECTION.LEFT;
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
        selectedDirection = DIRECTION.RIGHT;
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
        selectedDirection = DIRECTION.UP;
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
        selectedDirection = DIRECTION.DOWN;
      }
    }

    if (selectedDirection === DIRECTION.NONE) {
      selectedDirection = touchInput.consumeDirectionJustPressed();
    }

    return selectedDirection;
  }

  /** @returns {import('../common/direction.js').Direction} */
  getDirectionKeyPressedDown() {
    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE;
    if (this.#cursorKeys !== undefined) {
      if (this.#cursorKeys.left.isDown) {
        selectedDirection = DIRECTION.LEFT;
      } else if (this.#cursorKeys.right.isDown) {
        selectedDirection = DIRECTION.RIGHT;
      } else if (this.#cursorKeys.up.isDown) {
        selectedDirection = DIRECTION.UP;
      } else if (this.#cursorKeys.down.isDown) {
        selectedDirection = DIRECTION.DOWN;
      }
    }

    if (selectedDirection === DIRECTION.NONE) {
      selectedDirection = touchInput.getDirection();
    }

    return selectedDirection;
  }
}
