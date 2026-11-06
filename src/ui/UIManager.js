import { GUMBALL_COST } from '../constants.js';

/**
 * UIManager — controls all HTML overlay UI for the Crossy Road clone.
 *
 * Expects certain DOM elements to exist in the HTML:
 *   Screens:  #screen-title, #screen-game-over, #screen-characters, #screen-gumball
 *   HUD:      #hud, #hud-score, #hud-coins
 *   Buttons:  #btn-retry, #btn-menu, #btn-characters, #btn-char-back,
 *             #btn-gumball, #btn-gumball-back, #btn-pull
 *   Dynamic:  #game-over-score, #game-over-highscore, #game-over-new-high,
 *             #title-highscore, #character-grid, #gumball-coins,
 *             #gumball-result, #gumball-result-emoji, #gumball-result-name
 */
export class UIManager {
  constructor(game) {
    this.game = game;

    // ── Cache DOM references ────────────────────────────────────
    this.screens = {
      title:      document.getElementById('screen-title'),
      gameOver:   document.getElementById('screen-game-over'),
      characters: document.getElementById('screen-characters'),
      gumball:    document.getElementById('screen-gumball'),
    };

    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins');

    this.titleHighscore = document.getElementById('title-highscore');

    this.goScore     = document.getElementById('game-over-score');
    this.goHighscore = document.getElementById('game-over-highscore');
    this.goNewHigh   = document.getElementById('game-over-new-high');

    this.charGrid = document.getElementById('character-grid');

    this.gumballCoins      = document.getElementById('gumball-coins');
    this.gumballResult     = document.getElementById('gumball-result');
    this.gumballResultEmoji = document.getElementById('gumball-result-emoji');
    this.gumballResultName  = document.getElementById('gumball-result-name');

    // ── Button handlers ─────────────────────────────────────────
    this._bind('btn-retry',       () => game.retry());
    this._bind('btn-menu',        () => game.goToTitle());
    this._bind('btn-characters',  () => game.showCharacters());
    this._bind('btn-char-back',   () => game.goToTitle());
    this._bind('btn-gumball',     () => game.showGumball());
    this._bind('btn-gumball-back',() => game.goToTitle());

    // Tap-to-play on title screen (clicks not on buttons)
    if (this.screens.title) {
      this.screens.title.addEventListener('click', (e) => {
        // Only trigger if the click isn't on a button
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        game.startGame();
      });
    }
  }

  // ── Internal helpers ──────────────────────────────────────────

  _bind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  _show(el)  { if (el) el.classList.remove('hidden'); }
  _hide(el)  { if (el) el.classList.add('hidden'); }

  // ── Public API ────────────────────────────────────────────────

  hideAll() {
    Object.values(this.screens).forEach((s) => this._hide(s));
    this._hide(this.hud);
  }

  /**
   * Show the title screen.
   */
  showTitle(highScore = 0) {
    this.hideAll();
    this._show(this.screens.title);
    if (this.titleHighscore) {
      this.titleHighscore.textContent = highScore > 0 ? `High Score: ${highScore}` : '';
    }
  }

  /**
   * Transition to the playing state — show HUD only.
   */
  showPlaying() {
    this.hideAll();
    this._show(this.hud);
    this.updateScore(0);
  }

  /**
   * Show the game-over overlay.
   */
  showGameOver(score, highScore, isNewHigh) {
    this.hideAll();
    this._show(this.screens.gameOver);
    this._show(this.hud); // keep score visible
    if (this.goScore)     this.goScore.textContent = score;
    if (this.goHighscore) this.goHighscore.textContent = `Best: ${highScore}`;
    if (this.goNewHigh) {
      if (isNewHigh) {
        this._show(this.goNewHigh);
      } else {
        this._hide(this.goNewHigh);
      }
    }
  }

  /**
   * Build and show the character selection grid.
   * @param {Array} characters — all character objects
   * @param {string} selectedId — currently selected character id
   * @param {Function} onSelect — callback(id) when a character is picked
   */
  showCharacterSelect(characters, selectedId, onSelect) {
    this.hideAll();
    this._show(this.screens.characters);

    if (!this.charGrid) return;
    this.charGrid.innerHTML = '';

    // Group by theme
    const themes = {};
    characters.forEach((ch) => {
      if (!themes[ch.theme]) themes[ch.theme] = [];
      themes[ch.theme].push(ch);
    });

    Object.keys(themes).forEach((theme) => {
      // Theme heading
      const heading = document.createElement('h3');
      heading.className = 'char-theme-heading';
      heading.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      this.charGrid.appendChild(heading);

      // Character tiles
      const row = document.createElement('div');
      row.className = 'char-theme-row';

      themes[theme].forEach((ch) => {
        const tile = document.createElement('button');
        tile.className = 'char-tile';
        if (ch.id === selectedId) tile.classList.add('selected');
        if (!ch.unlocked) tile.classList.add('locked');
        tile.dataset.id = ch.id;

        tile.innerHTML = `
          <span class="char-emoji">${ch.unlocked ? ch.emoji : '🔒'}</span>
          <span class="char-name">${ch.unlocked ? ch.name : '???'}</span>
        `;

        tile.addEventListener('click', () => {
          if (ch.unlocked && onSelect) {
            onSelect(ch.id);
            // Update selection visuals
            this.charGrid.querySelectorAll('.char-tile.selected')
              .forEach((t) => t.classList.remove('selected'));
            tile.classList.add('selected');
          }
        });

        row.appendChild(tile);
      });

      this.charGrid.appendChild(row);
    });
  }

  /**
   * Show the gumball machine screen.
   * @param {Object} coinManager — must have .coins and .spend(amount) methods
   * @param {Object} characterManager — CharacterManager instance
   * @param {Function} onResult — callback(unlockedCharacter | null)
   */
  showGumball(coinManager, characterManager, onResult) {
    this.hideAll();
    this._show(this.screens.gumball);

    // Hide previous result
    if (this.gumballResult) this._hide(this.gumballResult);

    // Show current coins
    if (this.gumballCoins) {
      this.gumballCoins.textContent = `💰 ${coinManager.coins}`;
    }

    // Wire up the pull button
    const btnPull = document.getElementById('btn-pull');
    if (btnPull) {
      // Remove old listeners by cloning
      const newBtn = btnPull.cloneNode(true);
      btnPull.parentNode.replaceChild(newBtn, btnPull);

      newBtn.addEventListener('click', () => {
        const COST = GUMBALL_COST;

        if (coinManager.coins < COST) {
          // Not enough coins — flash the coin display
          if (this.gumballCoins) {
            this.gumballCoins.classList.add('shake');
            setTimeout(() => this.gumballCoins.classList.remove('shake'), 400);
          }
          return;
        }

        const char = characterManager.getRandomLocked();
        if (!char) {
          // All unlocked already
          if (this.gumballResultEmoji) this.gumballResultEmoji.textContent = '🎉';
          if (this.gumballResultName)  this.gumballResultName.textContent = 'All Unlocked!';
          if (this.gumballResult) this._show(this.gumballResult);
          return;
        }

        // Spend coins
        coinManager.spend(COST);

        // Unlock the character
        characterManager.unlock(char.id);

        // Update coin display
        if (this.gumballCoins) {
          this.gumballCoins.textContent = `💰 ${coinManager.coins}`;
        }

        // Show the result
        if (this.gumballResultEmoji) this.gumballResultEmoji.textContent = char.emoji;
        if (this.gumballResultName)  this.gumballResultName.textContent = char.name;
        if (this.gumballResult) this._show(this.gumballResult);

        if (onResult) onResult(char);
      });
    }
  }

  // ── HUD updates ───────────────────────────────────────────────

  updateScore(score) {
    if (this.hudScore) this.hudScore.textContent = score;
  }

  updateCoins(coins) {
    if (this.hudCoins) this.hudCoins.textContent = `💰 ${coins}`;
  }
}
