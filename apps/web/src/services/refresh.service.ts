import { useAuthUserStore } from '~/stores/auth';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { clearCache } from '~/composables/useQuery';
import { useApiFetch } from '~/composables/useApi';

class RefreshService {
  async refreshAll() {
    const api = useApiFetch();
    try {
      await this.user(api);
      await this.fieldsetting(api);
      clearCache();
      return true;
    } catch (e) {
      throw e;
    }
  }
  user(api: any) {
    return api.get('/v1/user/', '').then((response: any) => {
      useAuthUserStore().refresh(response);
    });
  }
  fieldsetting(api: any) {
    return api.get('/v1/fieldsetting/', '').then((response: any) => {
      useFieldsettingStore().refresh(response);
    });
  }
}

export default new RefreshService();
