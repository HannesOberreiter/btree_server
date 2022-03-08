import { api } from 'boot/axios';
import { RegisterUser, User } from '../types';
import { find } from 'lodash';
import { useAuthTokenStore } from '../stores/token';
import { useAuthUserStore } from '../stores/auth';

class AuthService {
  login(user: User) {
    const data = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    return api.post('/v1/auth/login', data).then((response: any) => {
      if (response.data.token.accessToken) {
        const storeToken = useAuthTokenStore();
        storeToken.refreshToken(response.data.token);
      }
      return response.data;
    });
  }

  async logout() {
    const storeToken = useAuthTokenStore();
    const storeUser = useAuthUserStore();
    storeToken.removeToken();
    await storeUser.logout();
  }

  register(user: RegisterUser) {
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
    const data = JSON.stringify({
      email: mail.email,
    });
    return api.post('/v1/auth/reset', data);
  }

  resetPassword(values: any) {
    const data = JSON.stringify({
      key: values.resetKey,
      password: values.password,
    });
    return api.patch('/v1/auth/reset', data);
  }

  activate(value: any) {
    const data = JSON.stringify({
      confirm: value.resetKey,
    });
    return api.patch('/v1/auth/confirm', data);
  }

  unsubscribe(mail: any) {
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
