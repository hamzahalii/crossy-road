import { CHARACTER_DATA } from './characterData.js';
import { CharacterFactory } from './CharacterFactory.js';

const STORAGE_UNLOCKED = 'crossy_unlocked';
const STORAGE_SELECTED = 'crossy_selected';

/**
 * CharacterManager — handles character selection, unlocking, and mesh creation.
 */
export class CharacterManager {
  constructor() {
    // Deep-clone base data so runtime mutations don't affect the source
    this.characters = CHARACTER_DATA.map((c) => ({ ...c, colors: { ...c.colors } }));

    // Restore persisted unlock state
    this._loadUnlockState();

    // Restore selected character
    this.selectedId = localStorage.getItem(STORAGE_SELECTED) || 'chicken';

    // Make sure selectedId is actually unlocked; fall back to chicken
    if (!this.isUnlocked(this.selectedId)) {
      this.selectedId = 'chicken';
    }
  }

  // ── Persistence helpers ───────────────────────────────────────

  _loadUnlockState() {
    try {
      const raw = localStorage.getItem(STORAGE_UNLOCKED);
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          ids.forEach((id) => {
            const ch = this.characters.find((c) => c.id === id);
            if (ch) ch.unlocked = true;
          });
        }
      }
    } catch {
      // Corrupted data — ignore, defaults apply
    }
  }

  _saveUnlockState() {
    const ids = this.characters.filter((c) => c.unlocked).map((c) => c.id);
    localStorage.setItem(STORAGE_UNLOCKED, JSON.stringify(ids));
  }

  _saveSelected() {
    localStorage.setItem(STORAGE_SELECTED, this.selectedId);
  }

  // ── Queries ───────────────────────────────────────────────────

  /**
   * Return the character data object for the currently selected character.
   */
  getSelected() {
    return this.characters.find((c) => c.id === this.selectedId) || this.characters[0];
  }

  /**
   * Check if a character is unlocked.
   */
  isUnlocked(id) {
    const ch = this.characters.find((c) => c.id === id);
    return ch ? ch.unlocked : false;
  }

  /**
   * Return all characters.
   */
  getAllCharacters() {
    return this.characters;
  }

  /**
   * Return only unlocked characters.
   */
  getUnlockedCharacters() {
    return this.characters.filter((c) => c.unlocked);
  }

  /**
   * Return the theme string for a character.
   */
  getTheme(id) {
    const ch = this.characters.find((c) => c.id === id);
    return ch ? ch.theme : 'classic';
  }

  /**
   * Return a random locked character (for the gumball machine).
   * Returns null if all characters are already unlocked.
   */
  getRandomLocked() {
    const locked = this.characters.filter((c) => !c.unlocked);
    if (locked.length === 0) return null;
    return locked[Math.floor(Math.random() * locked.length)];
  }

  // ── Mutations ─────────────────────────────────────────────────

  /**
   * Select a character (must be unlocked).
   */
  select(id) {
    if (this.isUnlocked(id)) {
      this.selectedId = id;
      this._saveSelected();
      return true;
    }
    return false;
  }

  /**
   * Unlock a character by id.
   */
  unlock(id) {
    const ch = this.characters.find((c) => c.id === id);
    if (ch && !ch.unlocked) {
      ch.unlocked = true;
      this._saveUnlockState();
      return true;
    }
    return false;
  }

  // ── Mesh creation ─────────────────────────────────────────────

  /**
   * Build a Three.js mesh for the character with the given id.
   * Falls back to the selected character if id is omitted.
   */
  createMesh(id) {
    const charId = id || this.selectedId;
    const data = this.characters.find((c) => c.id === charId);
    if (!data) {
      console.warn(`CharacterManager: unknown character "${charId}", falling back to chicken`);
      return CharacterFactory.createCharacterMesh(this.characters[0]);
    }
    return CharacterFactory.createCharacterMesh(data);
  }
}
