import { LoadingBar } from 'quasar';

export default () => {
  LoadingBar.setDefaults({
    color: 'primary',
    size: '10px',
    position: 'bottom',
    skipHijack: true
  });
};
