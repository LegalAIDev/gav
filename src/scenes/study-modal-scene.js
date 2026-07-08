import Phaser from '../lib/phaser.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';

/**
 * @typedef StudyModalSceneData
 * @type {object}
 * @property {string} previousSceneName the scene to resume when the modal is closed
 * @property {string} title heading shown at the top of the modal
 * @property {string[]} pages the educational content, shown one page at a time
 */

const PANEL_COLOR = 0x1e3a5f;
const BORDER_COLOR = 0xffffff;

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const TITLE_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#ffe066',
  fontSize: '36px',
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const BODY_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#ffffff',
  fontSize: '28px',
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const HINT_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#bcd3ff',
  fontSize: '20px',
});

/**
 * A large, centered "study" modal used by the overworld educational stands. It
 * pauses the world scene, shows one page of prep content at a time, and resumes
 * the previous scene once the player has read through it.
 */
export class StudyModalScene extends BaseScene {
  /** @type {StudyModalSceneData} */
  #sceneData;
  /** @type {number} */
  #pageIndex;
  /** @type {Phaser.GameObjects.Text} */
  #bodyText;
  /** @type {Phaser.GameObjects.Text} */
  #hintText;

  constructor() {
    super({
      key: SCENE_KEYS.STUDY_MODAL_SCENE,
    });
  }

  /**
   * @param {StudyModalSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;
    this.#pageIndex = 0;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(900, width - 80);
    const panelHeight = Math.min(460, height - 80);
    const x = (width - panelWidth) / 2;
    const y = (height - panelHeight) / 2;

    // dim the world behind the modal
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // modal panel
    this.add
      .rectangle(x, y, panelWidth, panelHeight, PANEL_COLOR, 0.96)
      .setOrigin(0)
      .setStrokeStyle(6, BORDER_COLOR, 1);

    // title + divider
    this.add.text(x + 32, y + 26, this.#sceneData.title, TITLE_TEXT_STYLE);
    this.add.rectangle(x + 32, y + 78, panelWidth - 64, 3, BORDER_COLOR, 0.7).setOrigin(0);

    // body copy for the current page
    this.#bodyText = this.add.text(x + 32, y + 100, '', {
      ...BODY_TEXT_STYLE,
      ...{ wordWrap: { width: panelWidth - 64 } },
    });

    // navigation hint pinned to the bottom of the panel
    this.#hintText = this.add.text(x + 32, y + panelHeight - 40, '', HINT_TEXT_STYLE);

    this.#renderPage();
  }

  /**
   * @returns {void}
   */
  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    if (this._controls.wasBackKeyPressed()) {
      this.#close();
      return;
    }

    if (this._controls.wasSpaceKeyPressed()) {
      if (this.#pageIndex >= this.#sceneData.pages.length - 1) {
        this.#close();
        return;
      }
      this.#pageIndex += 1;
      this.#renderPage();
    }
  }

  /**
   * @returns {void}
   */
  #renderPage() {
    const total = this.#sceneData.pages.length;
    this.#bodyText.setText(this.#sceneData.pages[this.#pageIndex]);
    const isLast = this.#pageIndex >= total - 1;
    const counter = total > 1 ? `(${this.#pageIndex + 1}/${total})  ` : '';
    this.#hintText.setText(`${counter}${isLast ? 'Press SPACE to close' : 'Press SPACE for more'}  -  B to exit`);
  }

  /**
   * @returns {void}
   */
  #close() {
    this._controls.lockInput = true;
    this.scene.stop(SCENE_KEYS.STUDY_MODAL_SCENE);
    this.scene.resume(this.#sceneData.previousSceneName);
  }
}
