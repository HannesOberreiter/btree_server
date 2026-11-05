import type { paths } from './generated/schema';

export type ApiaryPaginatedResponse =
  paths['/v1/apiary/']['get']['responses'][200]['content']['application/json'];
export type ApiaryResponse = ApiaryPaginatedResponse['results'][number];
export type ApiaryListItem = ApiaryResponse & {
  label: string;
  value: number;
  type: 'apiary';
};
export type ApiaryDetailResponse =
  paths['/v1/apiary/{id}']['get']['responses'][200]['content']['application/json'];
export type ApiaryForecastResponse =
  paths['/v1/service/weather/{apiary_id}']['get']['responses'][200]['content']['application/json'];

export type CalendarResponse =
  paths['/v1/calendar/checkup']['get']['responses'][200]['content']['application/json'];

export type ChargePaginatedResponse =
  paths['/v1/charge/']['get']['responses'][200]['content']['application/json'];
export type ChargeResponse = ChargePaginatedResponse['results'][number];
export type ChargeStockPaginatedResponse =
  paths['/v1/charge/stock']['get']['responses'][200]['content']['application/json'];
export type ChargeStockResponse =
  ChargeStockPaginatedResponse['results'][number];

export type StatisticKind = 'feed' | 'harvest' | 'rating' | 'treatment';
export type StatisticTaskKind = Exclude<StatisticKind, 'rating'>;
export type StatisticPaginatedResponse =
  paths['/v1/statistic/harvest/hive']['get']['responses'][200]['content']['application/json'];
export type StatisticResponse = StatisticPaginatedResponse['results'][number];
export type StatisticListResponse =
  paths['/v1/statistic/harvest/year']['get']['responses'][200]['content']['application/json'];

export type CheckupPaginatedResponse =
  paths['/v1/checkup/']['get']['responses'][200]['content']['application/json'];
export type CheckupResponse = CheckupPaginatedResponse['results'][number];

export type CompanyResponse =
  paths['/v1/company']['post']['responses'][200]['content']['application/json'];
export type CompanyPatchResponse =
  paths['/v1/company']['patch']['responses'][200]['content']['application/json'];
export type CompanyApiKeyResponse =
  paths['/v1/company/apikey']['get']['responses'][200]['content']['application/json'];
export type CompanyCountResponse =
  paths['/v1/company/count']['get']['responses'][200]['content']['application/json'];
export type CompanyPaidResponse =
  paths['/v1/company/coupon']['post']['responses'][200]['content']['application/json'];
export type CompanyPaymentsResponse =
  paths['/v1/company/payments']['get']['responses'][200]['content']['application/json'];
export type CompanyUserResponse =
  paths['/v1/company_user/user']['get']['responses'][200]['content']['application/json'];

export type AuthLoginResponse =
  paths['/v1/auth/login']['post']['responses'][200]['content']['application/json'];
export type AuthLogoutResponse =
  paths['/v1/auth/logout']['get']['responses'][200]['content']['application/json'];
export type AuthOauthUrlResponse =
  paths['/v1/auth/google']['get']['responses'][200]['content']['application/json'];
export type WaxLotListResponse =
  paths['/v1/wax/lots']['get']['responses'][200]['content']['application/json'];
export type WaxLotResponse = WaxLotListResponse['results'][number];
export type WaxOperationListResponse =
  paths['/v1/wax/operations']['get']['responses'][200]['content']['application/json'];
export type WaxOperationResponse = WaxOperationListResponse['results'][number];
export type WaxOperationLineResponse = WaxOperationResponse['lines'][number];

export type AuthDiscourseResponse =
  paths['/v1/auth/discourse']['get']['responses'][200]['content']['application/json'];
export type AuthRegisterResponse =
  paths['/v1/auth/register']['post']['responses'][200]['content']['application/json'];
export type AuthResetRequestResponse =
  paths['/v1/auth/reset']['post']['responses'][200]['content']['application/json'];
export type AuthEmailResponse =
  paths['/v1/auth/reset']['patch']['responses'][200]['content']['application/json'];

export type TodoPaginatedResponse =
  paths['/v1/todo/']['get']['responses'][200]['content']['application/json'];
export type TodoResponse = TodoPaginatedResponse['results'][number];
