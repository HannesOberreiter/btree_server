import { api } from '~/boot/axios';
import { useAuthUserStore } from '~/stores/auth';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { clearCache } from '~/composables/useQuery';

class RefreshService {
  async refreshAll() {
    await this.user();
    await this.fieldsetting();
    clearCache();
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
