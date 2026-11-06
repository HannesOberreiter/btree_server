import { useApiFetch } from '../composables/useApi';
import { useAuthUserStore } from '../stores/auth';
import { useFieldsettingStore } from '../stores/fieldsetting';

class RefreshService {
  private isFetching = false;

  async refresh(user = true) {
    const api = useApiFetch();
    try {
      if (user) {
        await this.user(api);
      }
      await this.fieldsetting(api);
      return true;
    } catch (e) {
      console.error(e);
      // await useAuthUserStore().logout();
    }
  }

  user(api: any) {
    console.log('Refreshing User from DB...');
    return api.get('/v1/user/', '').then((response: any) => {
      useAuthUserStore().refresh(response);
    });
  }

  fieldsetting(api: any) {
    if (this.isFetching) {
      console.debug('Already fetching field settings, skipping...');
      return;
    }
    this.isFetching = true;
    console.log('Refreshing Field Settings from DB...');
    return api.get('/v1/fieldsetting/', '').then((response: any) => {
      this.isFetching = false;
      useFieldsettingStore().refresh(response);
    });
  }
}

export default new RefreshService();
