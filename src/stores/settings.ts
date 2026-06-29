import { defineStore } from 'pinia';

interface SettingsState {
  theme: string;
}

// Default to Auto (follows the system); Light/Dark are available via the toggle.
function loadTheme(): string {
  try {
    return localStorage.getItem('theme') || 'auto';
  } catch {
    return 'auto';
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
