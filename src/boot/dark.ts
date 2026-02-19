import { Dark } from 'quasar';
import { boot } from 'quasar/wrappers';

export default boot(() => {
  const theme = localStorage.getItem('theme') || '';

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
