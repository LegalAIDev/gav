import { DIRECTION } from '../common/direction.js';

/**
 * On-screen touch controls for mobile play.
 *
 * This module renders a DOM overlay on top of the Phaser canvas and exposes the
 * resulting input state. The `Controls` class (src/utils/controls.js) merges
 * this state with the keyboard, so every scene and menu in the game becomes
 * touch-playable without any scene changes.
 *
 * Movement uses a **floating joystick** (the "Sneak Sasquatch" scheme): on a
 * touch device the whole left half of the screen is a movement pad — press
 * anywhere in it and the stick spawns under your thumb, then drag to steer.
 * There's nothing to reach for, which is what makes it feel so much better than
 * a fixed stick on an iPad. On desktop (no touch) the stick falls back to a
 * small fixed pad in the corner so the game stays mouse-testable.
 *
 * Actions are A/B/Y buttons on the right, mirroring the keyboard scheme:
 *   A  -> confirm  (ENTER / SPACE)
 *   B  -> back     (SHIFT)
 *   Y  -> interact (F)
 */

const BUTTON = Object.freeze({
  CONFIRM: 'CONFIRM',
  BACK: 'BACK',
  INTERACT: 'INTERACT',
});

const RADIUS = 54; // px of thumb travel from the stick origin
const DEADZONE = 16; // px before a direction registers

class TouchInput {
  #initialized = false;
  #heldDirection = DIRECTION.NONE;
  #justPressedDirection = DIRECTION.NONE;
  /** @type {Record<string, boolean>} buttons currently held */
  #buttonDown = { CONFIRM: false, BACK: false, INTERACT: false };
  /** @type {Record<string, boolean>} edge-triggered "was pressed", consumed on read */
  #buttonPressed = { CONFIRM: false, BACK: false, INTERACT: false };

  /** @type {HTMLElement | undefined} */
  #base;
  /** @type {HTMLElement | undefined} */
  #thumb;
  /** @type {{ x: number, y: number }} origin the current drag is measured from */
  #origin = { x: 0, y: 0 };
  /** @type {number | null} the pointer id currently driving the stick */
  #activePointer = null;

  /** Lazily build the DOM overlay. Safe to call more than once. */
  init() {
    if (this.#initialized || typeof document === 'undefined') {
      return;
    }
    this.#initialized = true;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    this.#buildStyles(isTouch);
    this.#buildJoystick(isTouch);
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

  /**
   * Update the thumb + held direction from an absolute pointer position,
   * measured against the current stick origin.
   */
  #updateFromPoint(clientX, clientY) {
    let dx = clientX - this.#origin.x;
    let dy = clientY - this.#origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    if (this.#thumb) {
      this.#thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    }

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
  }

  #release() {
    this.#activePointer = null;
    if (this.#thumb) {
      this.#thumb.style.transform = 'translate(0px, 0px)';
    }
    if (this.#base) {
      this.#base.classList.remove('tj-active');
    }
    this.#setDirection(DIRECTION.NONE);
  }

  #buildStyles(isTouch) {
    const style = document.createElement('style');
    style.textContent = `
      .touch-overlay {
        position: fixed; inset: 0; z-index: 1000;
        pointer-events: none; touch-action: none;
        font-family: system-ui, sans-serif;
      }
      .touch-overlay * { touch-action: none; user-select: none; -webkit-user-select: none; }

      /* Movement pad: the whole left side is a floating-stick zone on touch. */
      .tj-zone {
        position: absolute; left: 0; top: 0; bottom: 0; width: 50%;
        pointer-events: auto;
      }
      /* A faint resting ring hints where to press first; hidden while dragging. */
      .tj-hint {
        position: absolute; left: max(30px, env(safe-area-inset-left));
        bottom: max(30px, env(safe-area-inset-bottom));
        width: 116px; height: 116px; border-radius: 50%;
        border: 2px dashed rgba(255,255,255,.18);
        pointer-events: none; transition: opacity .12s ease;
      }
      .tj-zone.tj-dragging .tj-hint { opacity: 0; }

      .tj-base {
        position: absolute; width: 132px; height: 132px;
        margin: -66px 0 0 -66px; border-radius: 50%;
        background: rgba(255,255,255,.10); border: 2px solid rgba(255,255,255,.30);
        backdrop-filter: blur(2px); pointer-events: none;
      }
      .tj-thumb {
        position: absolute; left: 50%; top: 50%; width: 60px; height: 60px;
        margin: -30px 0 0 -30px; border-radius: 50%;
        background: rgba(255,255,255,.40); border: 2px solid rgba(255,255,255,.55);
        transition: transform .04s linear;
      }
      /* Floating (touch) stick: invisible until a press activates it. */
      .tj-float { opacity: 0; transition: opacity .12s ease; }
      .tj-float.tj-active { opacity: 1; }
      /* Fixed (desktop) stick: parked in the corner, always shown. */
      .tj-fixed {
        left: max(30px, env(safe-area-inset-left));
        bottom: max(30px, env(safe-area-inset-bottom));
        margin: 0; transform: none; pointer-events: auto;
      }
      .tj-fixed .tj-thumb { left: 66px; top: 66px; }

      .tb-cluster {
        position: absolute; right: max(20px, env(safe-area-inset-right));
        bottom: max(26px, env(safe-area-inset-bottom));
        width: 176px; height: 176px; z-index: 1; pointer-events: none;
      }
      .tb-btn {
        position: absolute; width: 72px; height: 72px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 24px; color: #fff; pointer-events: auto;
        background: rgba(58,134,255,.38); border: 2px solid rgba(255,255,255,.5);
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }
      .tb-btn:active { filter: brightness(1.4); transform: scale(.92); }
      .tb-a { right: 0; bottom: 52px; background: rgba(74,222,128,.42); }
      .tb-b { right: 92px; bottom: 8px; background: rgba(248,113,113,.42); }
      .tb-y { right: 52px; bottom: 104px; background: rgba(250,204,21,.42); }
      ${
        isTouch
          ? ''
          : `/* On a desktop with a mouse keep the controls subtle for testing. */
             .touch-overlay { opacity: .5; }`
      }
    `;
    document.head.appendChild(style);
  }

  #buildJoystick(isTouch) {
    const overlay = this.#overlay();

    const base = document.createElement('div');
    const thumb = document.createElement('div');
    thumb.className = 'tj-thumb';
    base.appendChild(thumb);
    this.#base = base;
    this.#thumb = thumb;

    if (isTouch) {
      this.#buildFloatingStick(overlay, base);
    } else {
      this.#buildFixedStick(overlay, base);
    }
  }

  /** Floating stick: press anywhere in the left zone and it spawns there. */
  #buildFloatingStick(overlay, base) {
    base.className = 'tj-base tj-float';
    overlay.appendChild(base);

    const zone = document.createElement('div');
    zone.className = 'tj-zone';
    const hint = document.createElement('div');
    hint.className = 'tj-hint';
    zone.appendChild(hint);
    overlay.appendChild(zone);

    zone.addEventListener('pointerdown', (ev) => {
      this.#activePointer = ev.pointerId;
      zone.setPointerCapture(ev.pointerId);
      zone.classList.add('tj-dragging');
      this.#origin = { x: ev.clientX, y: ev.clientY };
      base.style.left = `${ev.clientX}px`;
      base.style.top = `${ev.clientY}px`;
      base.classList.add('tj-active');
      this.#updateFromPoint(ev.clientX, ev.clientY);
      ev.preventDefault();
    });
    zone.addEventListener('pointermove', (ev) => {
      if (ev.pointerId === this.#activePointer) {
        this.#updateFromPoint(ev.clientX, ev.clientY);
        ev.preventDefault();
      }
    });
    const release = (ev) => {
      if (ev.pointerId !== this.#activePointer) {
        return;
      }
      zone.classList.remove('tj-dragging');
      this.#release();
    };
    zone.addEventListener('pointerup', release);
    zone.addEventListener('pointercancel', release);
  }

  /** Fixed stick: a parked pad in the corner, driven relative to its center. */
  #buildFixedStick(overlay, base) {
    base.className = 'tj-base tj-fixed';
    overlay.appendChild(base);

    const originFromBase = () => {
      const rect = base.getBoundingClientRect();
      this.#origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    base.addEventListener('pointerdown', (ev) => {
      this.#activePointer = ev.pointerId;
      base.setPointerCapture(ev.pointerId);
      originFromBase();
      this.#updateFromPoint(ev.clientX, ev.clientY);
      ev.preventDefault();
    });
    base.addEventListener('pointermove', (ev) => {
      if (ev.pointerId === this.#activePointer) {
        this.#updateFromPoint(ev.clientX, ev.clientY);
      }
    });
    base.addEventListener('pointerup', () => this.#release());
    base.addEventListener('pointercancel', () => this.#release());
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
