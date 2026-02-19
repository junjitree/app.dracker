import { defineBoot } from '#q-app/wrappers';
import AppBoolean from 'src/components/AppBoolean.vue';
import AppSelect from 'src/components/AppSelect.vue';
import AppTable from 'src/components/AppTable.vue';

export default defineBoot(({ app }) => {
  app.component('AppBoolean', AppBoolean);
  app.component('AppSelect', AppSelect);
  app.component('AppTable', AppTable);
});
