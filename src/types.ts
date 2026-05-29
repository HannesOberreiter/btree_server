declare module 'fastify' {
  interface Session {
    id?: number;
    user: {
      bee_id: number;
      user_id: number;
      rank: 1 | 2 | 3 | 4;
      paid: boolean;
      user_agent: string;
      last_visit: Date;
      uuid: string;
      ip: string;
    };
  }
}

export {};
