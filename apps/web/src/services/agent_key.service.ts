import { useApiFetch } from '../composables/useApi';

const ROUTE = '/v1/agent_key';

export interface AgentKeyResponse {
  id: number;
  key_prefix: string;
  label: string | null;
  user_id: number;
  bee_id: number;
  company_name: string | null;
  last_used: string | null;
  created_at: string;
  valid_to: string | null;
}

export interface AgentKeyCreateResponse extends AgentKeyResponse {
  key: string;
  message: string;
}

export function useAgentKeyService() {
  const api = useApiFetch();

  const list = async (): Promise<AgentKeyResponse[]> => {
    return api.get(ROUTE, '');
  };

  const create = async (payload: {
    label?: string | undefined;
    valid_to?: string | null | undefined;
  }): Promise<AgentKeyCreateResponse> => {
    return api.post(ROUTE, payload);
  };

  const remove = async (id: number): Promise<{ message: string }> => {
    return api.remove(`${ROUTE}/${id}`);
  };

  return { list, create, remove };
}
