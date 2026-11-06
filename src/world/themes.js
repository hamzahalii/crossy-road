/**
 * Theme color definitions for visual variety.
 */
export const THEMES = {
  classic: { sky: 0x87CEEB, grass: 0x4CAF50, grassDark: 0x388E3C, road: 0x424242, water: 0x2196F3, tree: 0x2E7D32, fog: null },
  spooky:  { sky: 0x1a0a2e, grass: 0x2d1b4e, grassDark: 0x1a0933, road: 0x1a1a2e, water: 0x4a0e78, tree: 0x4a148c, fog: 0x1a0a2e },
  arctic:  { sky: 0xD6EAF8, grass: 0xEBF5FB, grassDark: 0xD4E6F1, road: 0x5D6D7E, water: 0x85C1E9, tree: 0x2471A3, fog: 0xD6EAF8 },
  desert:  { sky: 0xFAD7A0, grass: 0xF0E68C, grassDark: 0xD4AC0D, road: 0xA04000, water: 0xD4AC0D, tree: 0x196F3D, fog: null },
  neon:    { sky: 0x0a0a0a, grass: 0x111111, grassDark: 0x0a0a0a, road: 0x0a0a0a, water: 0x00BCD4, tree: 0x00E676, fog: 0x0a0a0a },
};

export let currentTheme = THEMES.classic;

export function setTheme(name) {
  currentTheme = THEMES[name] || THEMES.classic;
}
