import { find } from 'lodash-es';
import { RegisterUser, User } from '~/types';
// import { useAuthTokenStore } from '~/stores/token';
// import { useAuthUserStore } from '~/stores/auth';
import { useApiFetch } from '~/composables/useApi';

class AuthService {
  async checkLogin() {
    const api = useApiFetch();

    return api
      .get('/v1/user/', '', true, false)
      .then((data) => data)
      .catch(() => false);
    /*
    .then((response: any) => {
      console.log(response);
      /*if (response.token.accessToken) {
        const storeToken = useAuthTokenStore();
        storeToken.refreshToken(response.token);
      }*/
    //return response;
    //});
  }

  login(user: User) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    return api.post('/v1/auth/login', data).then((response: any) => {
      /*if (response.token.accessToken) {
        const storeToken = useAuthTokenStore();
        storeToken.refreshToken(response.token);
      }*/
      return response;
    });
  }

  async logout() {
    const api = useApiFetch();
    return api
      .get('/v1/auth/logout', '', true, false)
      .then((data) => data)
      .catch(() => false);
  }

  register(user: RegisterUser) {
    const api = useApiFetch();

    const data = JSON.stringify({
      name: user.company,
      email: user.email,
      password: user.password,
      source: user.source,
      lang: user.lang,
      newsletter: user.newsletter ? true : false,
    });
    return api.post('/v1/auth/register', data);
  }

  resetMail(mail: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: mail.email,
    });
    return api.post('/v1/auth/reset', data);
  }

  resetPassword(values: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      key: values.resetKey,
      password: values.password,
    });
    return api.patch('/v1/auth/reset', data);
  }

  activate(value: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      confirm: value.resetKey,
    });
    return api.patch('/v1/auth/confirm', data);
  }

  unsubscribe(mail: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: mail.email,
    });
    return api.patch('/v1/auth/unsubscribe', data);
  }

  getCurrentCompany(user: User) {
    const curId = user.saved_company || 0;
    const companies = user.company;
    let currentCompany: any = companies[0];
    if (curId !== 0) {
      currentCompany = find(companies, { id: curId });
    }
    // In case the user got removed from the saved company
    if (!currentCompany) {
      currentCompany = companies[0];
    }
    localStorage.setItem('company', JSON.stringify(currentCompany));
    return currentCompany;
  }
}

export default new AuthService();
