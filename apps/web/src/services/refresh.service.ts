import { useAuthUserStore } from '~/stores/auth';
import { useFieldsettingStore } from '~/stores/fieldsetting';
import { useInvalidateQueries } from '~/composables/useQuery';
import { useApiFetch } from '~/composables/useApi';

class RefreshService {
  async refresh(user = true, clear = true) {
    const api = useApiFetch();
    try {
      if (user) await this.user(api);
      await this.fieldsetting(api);
      if (clear) {
        const useInvalidate = useInvalidateQueries();
        useInvalidate.invalidate('');
      }
      return true;
    } catch (e) {
      console.error(e);
      await useAuthUserStore().logout();
    }
  }
  user(api: any) {
    console.log('Refreshing User from DB...');
    return api.get('/v1/user/', '').then((response: any) => {
      useAuthUserStore().refresh(response);
    });
  }
  fieldsetting(api: any) {
    console.log('Refreshing Field Settings from DB...');
    return api.get('/v1/fieldsetting/', '').then((response: any) => {
      useFieldsettingStore().refresh(response);
    });
  }
}

export default new RefreshService();
