import { defineStore } from 'pinia';

interface SettingsState {
  theme: string;
}

// Default to our agreed light brand look; Auto/Dark are available via the toggle.
function loadTheme(): string {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: loadTheme(),
  }),
  actions: {
    setTheme(value: string) {
      this.theme = value;
      localStorage.setItem('theme', value);
    },
  },
});
