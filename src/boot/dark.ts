import { Dark } from 'quasar';
import { boot } from 'quasar/wrappers';
import { useSettingsStore } from 'src/stores/settings';

export default boot(() => {
  const settingsStore = useSettingsStore();
  const theme = settingsStore.theme;

  if (theme == 'dark') {
    Dark.set(true);
  } else if (theme == 'light') {
    Dark.set(false);
  } else if (theme != '' && theme != 'auto') {
    Dark.set(!theme?.includes('light'));
    document.body.setAttribute('theme', theme?.replace('light', '') || '');
  } else {
    Dark.set('auto');
  }
});
