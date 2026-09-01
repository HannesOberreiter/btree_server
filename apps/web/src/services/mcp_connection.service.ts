import { useApiFetch } from '@/composables/useApi';

const ROUTE = '/v1/mcp/connections';

export interface McpConnectionResponse {
  token_family: string;
  client_id: string;
  client_name: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
}

interface McpRevocationResponse {
  revoked: number;
}

export function useMcpConnectionService() {
  const api = useApiFetch();

  const list = async (): Promise<McpConnectionResponse[]> => {
    return api.get(ROUTE, '');
  };

  const remove = async (
    tokenFamily: string
  ): Promise<McpRevocationResponse> => {
    return api.remove(`${ROUTE}/${tokenFamily}`);
  };

  const removeAll = async (): Promise<McpRevocationResponse> => {
    return api.remove(ROUTE);
  };

  return { list, remove, removeAll };
}
