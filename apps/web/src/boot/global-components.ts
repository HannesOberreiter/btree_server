import { boot } from 'quasar/wrappers';
import BtnBase from '../components/BtnBase.vue';
import BtnBaseGroup from '../components/BtnBaseGroup.vue';
import TooltipBase from '../components/TooltipBase.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import BtnMultipleValues from '../components/BtnMultipleValues.vue';

export default boot(async ({ app }) => {
  app.component('BtnBase', BtnBase);
  app.component('BtnBaseGroup', BtnBaseGroup);
  app.component('BtnMultipleValues', BtnMultipleValues);
  app.component('TooltipBase', TooltipBase);
  app.component('GlobalLoading', GlobalLoading);
});
