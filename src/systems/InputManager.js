/**
 * InputManager — handles keyboard and touch input for Crossy Road clone.
 * Dispatches direction strings: 'forward', 'backward', 'left', 'right'
 */
export class InputManager {
  constructor() {
    this.enabled = true;
    this._callbacks = [];
    this._touchStartX = 0;
    this._touchStartY = 0;

    // Bind handlers so we can remove them later if needed
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onClick = this._handleClick.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    window.addEventListener('click', this._onClick);
  }

  /**
   * Register a callback that receives a direction string.
   * @param {function(string): void} callback
   */
  onInput(callback) {
    this._callbacks.push(callback);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  // ── internal dispatch ──────────────────────────────────────────

  _dispatch(direction) {
    if (!this.enabled) return;
    for (const cb of this._callbacks) {
      cb(direction);
    }
  }

  // ── keyboard ───────────────────────────────────────────────────

  _handleKeyDown(e) {
    let direction = null;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'forward';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'backward';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
    }

    if (direction) {
      // Prevent arrow keys from scrolling the page
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
      }
      this._dispatch(direction);
    }
  }

  // ── touch ──────────────────────────────────────────────────────

  _handleTouchStart(e) {
    const touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
  }

  _handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this._touchStartX;
    const dy = touch.clientY - this._touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const MIN_SWIPE = 30;

    if (dist < MIN_SWIPE) {
      // Tap → forward
      this._dispatch('forward');
      return;
    }

    // Determine dominant axis
    if (Math.abs(dx) > Math.abs(dy)) {
      this._dispatch(dx > 0 ? 'right' : 'left');
    } else {
      // Screen Y-axis: negative = swipe up = forward
      this._dispatch(dy < 0 ? 'forward' : 'backward');
    }
  }

  // ── click ──────────────────────────────────────────────────────

  _handleClick(e) {
    if (e && e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('#screen-title') || e.target.closest('#screen-game-over') || e.target.closest('#screen-characters') || e.target.closest('#screen-gumball'))) {
      return;
    }
    this._dispatch('forward');
  }

  // ── cleanup ────────────────────────────────────────────────────

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('click', this._onClick);
    this._callbacks.length = 0;
  }
}
