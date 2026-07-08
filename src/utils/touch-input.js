import { DIRECTION } from '../common/direction.js';

/**
 * On-screen touch controls for mobile play.
 *
 * This module renders a DOM overlay (a virtual joystick + A/B/Y buttons) on top
 * of the Phaser canvas and exposes the resulting input state. The `Controls`
 * class (src/utils/controls.js) merges this state with the keyboard, so every
 * scene and menu in the game becomes touch-playable without any scene changes.
 *
 * Button mapping mirrors the keyboard scheme used across the game:
 *   A  -> confirm  (ENTER / SPACE)
 *   B  -> back     (SHIFT)
 *   Y  -> interact (F)
 */

const BUTTON = Object.freeze({
  CONFIRM: 'CONFIRM',
  BACK: 'BACK',
  INTERACT: 'INTERACT',
});

class TouchInput {
  #initialized = false;
  #heldDirection = DIRECTION.NONE;
  #justPressedDirection = DIRECTION.NONE;
  /** @type {Record<string, boolean>} buttons currently held */
  #buttonDown = { CONFIRM: false, BACK: false, INTERACT: false };
  /** @type {Record<string, boolean>} edge-triggered "was pressed", consumed on read */
  #buttonPressed = { CONFIRM: false, BACK: false, INTERACT: false };

  /** Lazily build the DOM overlay. Safe to call more than once. */
  init() {
    if (this.#initialized || typeof document === 'undefined') {
      return;
    }
    this.#initialized = true;
    this.#buildStyles();
    this.#buildJoystick();
    this.#buildButtons();
  }

  /** @returns {import('../common/direction.js').Direction} currently held direction */
  getDirection() {
    return this.#heldDirection;
  }

  /**
   * Edge-triggered direction for menu navigation. Returns a direction once per
   * NONE -> direction transition, then NONE until the stick re-centers.
   * @returns {import('../common/direction.js').Direction}
   */
  consumeDirectionJustPressed() {
    const dir = this.#justPressedDirection;
    this.#justPressedDirection = DIRECTION.NONE;
    return dir;
  }

  /** @param {string} button one of BUTTON */
  isButtonDown(button) {
    return this.#buttonDown[button] === true;
  }

  /** @param {string} button one of BUTTON — edge-triggered, consumed on read */
  consumeButtonPressed(button) {
    if (this.#buttonPressed[button]) {
      this.#buttonPressed[button] = false;
      return true;
    }
    return false;
  }

  #setDirection(newDirection) {
    if (newDirection !== DIRECTION.NONE && newDirection !== this.#heldDirection) {
      this.#justPressedDirection = newDirection;
    }
    this.#heldDirection = newDirection;
  }

  #buildStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-overlay {
        position: fixed; inset: 0; z-index: 1000;
        pointer-events: none; touch-action: none;
        font-family: system-ui, sans-serif;
      }
      .touch-overlay * { pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none; }
      .tj-base {
        position: absolute; left: max(18px, env(safe-area-inset-left));
        bottom: max(24px, env(safe-area-inset-bottom));
        width: 132px; height: 132px; border-radius: 50%;
        background: rgba(255,255,255,.10); border: 2px solid rgba(255,255,255,.28);
        backdrop-filter: blur(2px);
      }
      .tj-thumb {
        position: absolute; left: 50%; top: 50%; width: 58px; height: 58px;
        margin: -29px 0 0 -29px; border-radius: 50%;
        background: rgba(255,255,255,.35); border: 2px solid rgba(255,255,255,.5);
        transition: transform .04s linear;
      }
      .tb-cluster {
        position: absolute; right: max(18px, env(safe-area-inset-right));
        bottom: max(24px, env(safe-area-inset-bottom));
        width: 150px; height: 150px;
      }
      .tb-btn {
        position: absolute; width: 62px; height: 62px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 20px; color: #fff;
        background: rgba(58,134,255,.35); border: 2px solid rgba(255,255,255,.45);
      }
      .tb-btn:active { filter: brightness(1.4); transform: scale(.94); }
      .tb-a { right: 0; bottom: 44px; background: rgba(74,222,128,.35); }
      .tb-b { right: 78px; bottom: 8px; background: rgba(248,113,113,.35); }
      .tb-y { right: 44px; bottom: 88px; background: rgba(250,204,21,.35); }
      @media (hover: hover) and (pointer: fine) {
        /* On a desktop with a mouse the joystick is still usable for testing,
           but keep it subtle. Remove this block to always show at full strength. */
        .touch-overlay { opacity: .5; }
      }
    `;
    document.head.appendChild(style);
  }

  #buildJoystick() {
    const overlay = this.#overlay();
    const base = document.createElement('div');
    base.className = 'tj-base';
    const thumb = document.createElement('div');
    thumb.className = 'tj-thumb';
    base.appendChild(thumb);
    overlay.appendChild(base);

    const RADIUS = 46; // px of thumb travel
    const DEADZONE = 14;
    let activePointer = null;

    const updateFromEvent = (ev) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = ev.clientX - cx;
      let dy = ev.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > RADIUS) {
        dx = (dx / dist) * RADIUS;
        dy = (dy / dist) * RADIUS;
      }
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      if (dist < DEADZONE) {
        this.#setDirection(DIRECTION.NONE);
        return;
      }
      // 4-way: pick the dominant axis
      if (Math.abs(dx) > Math.abs(dy)) {
        this.#setDirection(dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT);
      } else {
        this.#setDirection(dy > 0 ? DIRECTION.DOWN : DIRECTION.UP);
      }
    };

    const release = () => {
      activePointer = null;
      thumb.style.transform = 'translate(0px, 0px)';
      this.#setDirection(DIRECTION.NONE);
    };

    base.addEventListener('pointerdown', (ev) => {
      activePointer = ev.pointerId;
      base.setPointerCapture(ev.pointerId);
      updateFromEvent(ev);
      ev.preventDefault();
    });
    base.addEventListener('pointermove', (ev) => {
      if (activePointer === ev.pointerId) {
        updateFromEvent(ev);
      }
    });
    base.addEventListener('pointerup', release);
    base.addEventListener('pointercancel', release);
  }

  #buildButtons() {
    const overlay = this.#overlay();
    const cluster = document.createElement('div');
    cluster.className = 'tb-cluster';
    overlay.appendChild(cluster);

    const make = (label, cls, button) => {
      const el = document.createElement('div');
      el.className = `tb-btn ${cls}`;
      el.textContent = label;
      const press = (ev) => {
        this.#buttonDown[button] = true;
        this.#buttonPressed[button] = true;
        ev.preventDefault();
      };
      const lift = () => {
        this.#buttonDown[button] = false;
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', lift);
      el.addEventListener('pointercancel', lift);
      el.addEventListener('pointerleave', lift);
      cluster.appendChild(el);
    };

    make('A', 'tb-a', BUTTON.CONFIRM);
    make('B', 'tb-b', BUTTON.BACK);
    make('Y', 'tb-y', BUTTON.INTERACT);
  }

  #overlay() {
    let overlay = document.querySelector('.touch-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'touch-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }
}

export const TOUCH_BUTTON = BUTTON;
export const touchInput = new TouchInput();
