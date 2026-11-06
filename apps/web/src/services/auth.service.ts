import type {
  AuthEmailResponse,
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthRegisterResponse,
  AuthResetRequestResponse
} from '../api/types';
import type { RegisterUser, User } from '../types';
import { find } from 'lodash-es';
import { useApiFetch } from '../composables/useApi';

class AuthService {
  async checkLogin() {
    const api = useApiFetch();

    return api
      .get('/v1/user/', '', true, false)
      .then(data => data)
      .catch(() => false);
  }

  login(user: User) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: user.email,
      password: user.password
    });
    return api.post('/v1/auth/login', data) as Promise<AuthLoginResponse>;
  }

  async logout() {
    const api = useApiFetch();
    return (
      api.get('/v1/auth/logout', '', true, false) as Promise<AuthLogoutResponse>
    ).catch(() => false);
  }

  register(user: RegisterUser) {
    const api = useApiFetch();

    const data = JSON.stringify({
      name: user.company,
      email: user.email,
      password: user.password,
      source: user.source,
      lang: user.lang,
      format: user.format,
      newsletter: !!user.newsletter,
      isOAuth: !!user.isOAuth
    });
    return api.post('/v1/auth/register', data) as Promise<AuthRegisterResponse>;
  }

  resetMail(mail: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: mail.email
    });
    return api.post(
      '/v1/auth/reset',
      data
    ) as Promise<AuthResetRequestResponse>;
  }

  resetPassword(values: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      key: values.resetKey,
      password: values.password
    });
    return api.patch('/v1/auth/reset', data) as Promise<AuthEmailResponse>;
  }

  activate(value: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      confirm: value.resetKey
    });
    return api.patch('/v1/auth/confirm', data) as Promise<AuthEmailResponse>;
  }

  unsubscribe(mail: any) {
    const api = useApiFetch();
    const data = JSON.stringify({
      email: mail.email
    });
    return api.patch(
      '/v1/auth/unsubscribe',
      data
    ) as Promise<AuthEmailResponse>;
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
