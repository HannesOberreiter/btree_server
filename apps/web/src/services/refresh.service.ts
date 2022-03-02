import { api } from 'boot/axios';

import _ from 'lodash';
import { useAuthUserStore } from '../stores/auth';
import { useFieldsettingStore } from '../stores/fieldsetting';

class RefreshService {
  async refreshAll() {
    await this.user();
    await this.fieldsetting();
  }
  user() {
    return api.get('/v1/user/').then((response) => {
      useAuthUserStore().refresh(response.data);
    });
  }
  fieldsetting() {
    return api.get('/v1/fieldsetting/').then((response) => {
      useFieldsettingStore().refresh(response.data);
    });
  }
}

export default new RefreshService();
