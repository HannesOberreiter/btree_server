/* eslint-disable typescript/no-redundant-type-constituents -- generated OpenAPI types */
export interface paths {
  '/v1/agent_key/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              bee_id: number;
              company_name: string | null;
              created_at: string;
              id: number;
              key_prefix: string;
              label: string | null;
              last_used: string | null;
              user_id: number;
              valid_to: string | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            label?: string;
            valid_to?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              id: number;
              key: string;
              key_prefix: string;
              label: string | null;
              message: string;
              valid_to: string | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/agent_key/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              message: string;
            };
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/apiary/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          deleted?: boolean;
          details?: boolean;
          direction?:
            | ('asc' | 'desc' | 'ASC' | 'DESC')
            | ('asc' | 'desc' | 'ASC' | 'DESC')[];
          limit?: number;
          modus?: boolean | null;
          offset?: number;
          order?:
            | (
                | 'id'
                | 'name'
                | 'modus'
                | 'hive_count.count'
                | 'created_at'
                | 'updated_at'
                | 'deleted_at'
              )
            | (
                | 'id'
                | 'name'
                | 'modus'
                | 'hive_count.count'
                | 'created_at'
                | 'updated_at'
                | 'deleted_at'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                bee_id?: number | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                deleted?: boolean;
                deleted_at?: string | null;
                description?: string | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                elevation?: number | null;
                hive_count?:
                  | ({
                      apiary_name: string;
                      count: number;
                      grouphivescount: number;
                      id: number;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                id: number;
                latitude: number;
                longitude: number;
                modus?: boolean;
                name: string;
                note?: string | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            deleted?: boolean;
            deleted_at?: string | null;
            description?: string;
            elevation?: (number | string) | null;
            latitude?: number | string;
            longitude?: number | string;
            modus?: boolean;
            name: string;
            note?: string;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean;
              deleted_at?: string | null;
              description?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              elevation?: number | null;
              hive_count?:
                | ({
                    apiary_name: string;
                    count: number;
                    grouphivescount: number;
                    id: number;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              latitude: number;
              longitude: number;
              modus?: boolean;
              name: string;
              note?: string | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              deleted?: boolean;
              deleted_at?: string | null;
              description?: string;
              elevation?: (number | string) | null;
              latitude?: number | string;
              longitude?: number | string;
              modus?: boolean;
              name?: string;
              note?: string;
              url?: string;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/apiary/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean;
              deleted_at?: string | null;
              description?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              elevation?: number | null;
              firstMovedate?:
                | ({
                    apiary_id?: number | null;
                    date: string;
                    hive_id?: number | null;
                    id: number;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_count?:
                | ({
                    apiary_name: string;
                    count: number;
                    grouphivescount: number;
                    id: number;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hives: ({
                id: number;
                mark_colour?: string | null;
                name: string;
                position?: number | null;
                queen_modus?: boolean | null;
                queen_name?: string | null;
              } & {
                [key: string]: unknown;
              })[];
              id: number;
              latitude: number;
              longitude: number;
              modus?: boolean;
              name: string;
              note?: string | null;
              sameLocation: ({
                id: number;
                name: string;
              } & {
                [key: string]: unknown;
              })[];
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/apiary/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          hard?: boolean | string | number;
          restore?: boolean | string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean;
              deleted_at?: string | null;
              description?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              elevation?: number | null;
              hive_count?:
                | ({
                    apiary_name: string;
                    count: number;
                    grouphivescount: number;
                    id: number;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              latitude: number;
              longitude: number;
              modus?: boolean;
              name: string;
              note?: string | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/apiary/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean;
              deleted_at?: string | null;
              description?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              elevation?: number | null;
              hive_count?:
                | ({
                    apiary_name: string;
                    count: number;
                    grouphivescount: number;
                    id: number;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              latitude: number;
              longitude: number;
              modus?: boolean;
              name: string;
              note?: string | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/apiary/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/auth/apple': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              url: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/apple/callback': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          code: string;
          error?: string;
          id_token?: string;
          state: string;
          user?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            code: string;
            error?: string;
            id_token: string;
            state: string;
            user?:
              | string
              | {
                  /** Format: email */
                  email: string;
                }
              | ''
              | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/confirm': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            confirm: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              email: string;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/auth/discourse': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          payload: string;
          sig: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              q: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/google': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              url: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/google/callback': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          code: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
            password: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              data: {
                acdate?: boolean;
                company: ({
                  api_active?: boolean;
                  id: number;
                  name: string;
                  paid?: string | null;
                  rank?: number | null;
                } & {
                  [key: string]: unknown;
                })[];
                email: string;
                format?: string | null;
                id: number;
                lang: string;
                newsletter?: boolean;
                saved_company?: number | null;
                sound?: boolean;
                state: number;
                todo?: boolean;
                username?: string | null;
              } & {
                [key: string]: unknown;
              };
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': boolean;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/ping': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              status: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
            isOAuth?: boolean;
            lang: string;
            name: string;
            newsletter: boolean;
            password: string;
            source: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              activate: string;
              email: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/reset': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              email: string;
              id?: number;
              token?: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            key: string;
            password: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              email: string;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/auth/unsubscribe': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              email: string;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/calendar/checkup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/feed': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/harvest': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/movedate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/rearing': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          end?: string;
          id?: number;
          start?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/scale_data': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/todo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/calendar/treatment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end: string;
          start: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              allDay: boolean;
              color?: string;
              creators?: string;
              description?: (string | number) | null;
              displayEventTime?: boolean;
              durationEditable?: boolean;
              editable?: boolean;
              editors?: string;
              end?: string;
              icon?: string;
              id?: string | number;
              name?: string | null;
              start: string;
              symbol?: string;
              table?: string;
              task_ids?: string | number;
              textColor?: string;
              title: string;
              unicode?: string;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/charge/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          deleted?: boolean;
          direction?:
            | ('asc' | 'desc' | 'ASC' | 'DESC')
            | ('asc' | 'desc' | 'ASC' | 'DESC')[];
          filters?: string;
          limit?: number;
          offset?: number;
          order?: string | string[];
          q?: string | number | boolean;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                amount?: number | null;
                bee_id?: number | null;
                bestbefore?: string | null;
                calibrate?: string | null;
                charge?: string | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean;
                deleted_at?: string | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                id: number;
                kind: string;
                name?: string | null;
                note?: string | null;
                price?: number | null;
                type?:
                  | ({
                      favorite?: boolean;
                      id: number;
                      modus?: boolean;
                      name: string;
                      unit?: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json':
            | ({
                amount?: number | null;
                bestbefore?: string | null;
                charge?: string | null;
                date?: string;
                /** @enum {string} */
                kind: 'in' | 'out';
                name?: string | null;
                note?: string | null;
                price?: number | null;
                type_id?: number | null;
                url?: string | null;
              } & {
                [key: string]: unknown;
              })
            | ({
                amount: number;
                bestbefore?: string | null;
                charge?: string | null;
                date?: string;
                /** @enum {string} */
                kind: 'inventory';
                name?: string | null;
                note?: string | null;
                price?: number | null;
                type_id: number;
                url?: string | null;
              } & {
                [key: string]: unknown;
              });
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              amount?: number | null;
              bestbefore?: string | null;
              charge?: string | null;
              date?: string | null;
              /** @enum {string} */
              kind?: 'in' | 'out';
              name?: string | null;
              note?: string | null;
              price?: number | null;
              type_id?: number | null;
              url?: string | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/charge/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          hard?: boolean | string | number;
          restore?: boolean | string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              amount?: number | null;
              bee_id?: number | null;
              bestbefore?: string | null;
              calibrate?: string | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              kind: string;
              name?: string | null;
              note?: string | null;
              price?: number | null;
              type?:
                | ({
                    favorite?: boolean;
                    id: number;
                    modus?: boolean;
                    name: string;
                    unit?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/charge/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              amount?: number | null;
              bee_id?: number | null;
              bestbefore?: string | null;
              calibrate?: string | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              kind: string;
              name?: string | null;
              note?: string | null;
              price?: number | null;
              type?:
                | ({
                    favorite?: boolean;
                    id: number;
                    modus?: boolean;
                    name: string;
                    unit?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/charge/stock': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?:
            | ('asc' | 'desc' | 'ASC' | 'DESC')
            | ('asc' | 'desc' | 'ASC' | 'DESC')[];
          limit?: number;
          offset?: number;
          order?: string | string[];
          q?: string | number | boolean;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                id: number;
                name: string;
                sum?: (number | string) | null;
                sum_in?: (number | string) | null;
                sum_out?: (number | string) | null;
                unit?: string | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/checkup/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          deleted?: boolean;
          direction?:
            | ('asc' | 'desc' | 'ASC' | 'DESC')
            | ('asc' | 'desc' | 'ASC' | 'DESC')[];
          done?: boolean | null;
          filters?: string;
          limit?: number;
          offset?: number;
          order?: string | string[];
          q?: string | number | boolean;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                bee_id?: number | null;
                brood?: number | null;
                broodframes?: number | null;
                calm_comb?: number | null;
                capped_brood?: boolean | null;
                checkup_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                comb?: number | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean;
                deleted_at?: string | null;
                done?: boolean;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                eggs?: boolean | null;
                emptyframes?: number | null;
                enddate?: string | null;
                foundation?: number | null;
                hive?:
                  | ({
                      id: number;
                      name: string;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                honeyframes?: number | null;
                id: number;
                note?: string | null;
                pollen?: number | null;
                queen?: boolean | null;
                queencells?: boolean | null;
                strong?: number | null;
                swarm?: number | null;
                temper?: number | null;
                temperature?: number | null;
                time?: string | null;
                type?: {
                  [key: string]: unknown;
                } | null;
                type_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
                varroa?: number | null;
                weight?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            brood?: number | null;
            broodframes?: number | null;
            calm_comb?: number | null;
            capped_brood?: boolean | null;
            comb?: number | null;
            date: string;
            deleted?: boolean;
            done?: boolean;
            eggs?: boolean | null;
            emptyframes?: number | null;
            enddate?: string | null;
            foundation?: number | null;
            hive_ids: number[];
            honeyframes?: number | null;
            interval: number;
            note?: string | null;
            pollen?: number | null;
            queen?: boolean | null;
            queencells?: boolean | null;
            repeat: number;
            strong?: number | null;
            swarm?: number | null;
            temper?: number | null;
            temperature?: number | null;
            time?: string | null;
            type_id?: number | null;
            url?: string | null;
            varroa?: number | null;
            weight?: number | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              brood?: number | null;
              broodframes?: number | null;
              calm_comb?: number | null;
              capped_brood?: boolean | null;
              comb?: number | null;
              date?: string;
              deleted?: boolean;
              done?: boolean;
              eggs?: boolean | null;
              emptyframes?: number | null;
              enddate?: string | null;
              foundation?: number | null;
              honeyframes?: number | null;
              note?: string | null;
              pollen?: number | null;
              queen?: boolean | null;
              queencells?: boolean | null;
              strong?: number | null;
              swarm?: number | null;
              temper?: number | null;
              temperature?: number | null;
              time?: string | null;
              type_id?: number | null;
              url?: string | null;
              varroa?: number | null;
              weight?: number | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/checkup/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          hard?: boolean | string | number;
          restore?: boolean | string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              brood?: number | null;
              broodframes?: number | null;
              calm_comb?: number | null;
              capped_brood?: boolean | null;
              checkup_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              comb?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean;
              deleted_at?: string | null;
              done?: boolean;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              eggs?: boolean | null;
              emptyframes?: number | null;
              enddate?: string | null;
              foundation?: number | null;
              hive?:
                | ({
                    id: number;
                    name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              honeyframes?: number | null;
              id: number;
              note?: string | null;
              pollen?: number | null;
              queen?: boolean | null;
              queencells?: boolean | null;
              strong?: number | null;
              swarm?: number | null;
              temper?: number | null;
              temperature?: number | null;
              time?: string | null;
              type?: {
                [key: string]: unknown;
              } | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              varroa?: number | null;
              weight?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/checkup/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              brood?: number | null;
              broodframes?: number | null;
              calm_comb?: number | null;
              capped_brood?: boolean | null;
              checkup_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              comb?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean;
              deleted_at?: string | null;
              done?: boolean;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              eggs?: boolean | null;
              emptyframes?: number | null;
              enddate?: string | null;
              foundation?: number | null;
              hive?:
                | ({
                    id: number;
                    name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              honeyframes?: number | null;
              id: number;
              note?: string | null;
              pollen?: number | null;
              queen?: boolean | null;
              queencells?: boolean | null;
              strong?: number | null;
              swarm?: number | null;
              temper?: number | null;
              temperature?: number | null;
              time?: string | null;
              type?: {
                [key: string]: unknown;
              } | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              varroa?: number | null;
              weight?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/checkup/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            end: string;
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/checkup/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/company': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              api_active?: boolean;
              api_key?: string | null;
              created_at?: string | null;
              id: number;
              name: string;
              paid?: string | null;
              updated_at?: string | null;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            api_change?: boolean;
            name?: string;
            password?: string;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              api_active: boolean;
              api_key?: string | null;
              created_at?: string | null;
              id: number;
              name: string;
              paid?: string | null;
              updated_at?: string | null;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/company_user/{company_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          company_id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              data: {
                [key: string]: unknown;
              };
              result: number;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company_user/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            rank: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/company_user/add_user': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json':
              | ({
                  userExists: {
                    id: number;
                  };
                } & {
                  [key: string]: unknown;
                })
              | ({
                  email: string;
                  id?: number;
                  token?: string;
                } & {
                  [key: string]: unknown;
                });
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company_user/remove_user/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company_user/user': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id: number;
              company: {
                id: number;
                name: string;
              } & {
                [key: string]: unknown;
              };
              id: number;
              rank: number;
              user: {
                email: string;
                id: number;
                last_visit: string;
                username?: string | null;
              } & {
                [key: string]: unknown;
              };
              user_id: number;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              data: {
                [key: string]: unknown;
              };
              result: number;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/apikey': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              api_key: string | null;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/count': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              count: number | string;
              kind: string;
              user_id: number;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/coupon': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            coupon: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              paid: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/download': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/import': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            upload: unknown;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              name: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/invoice': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount: number;
            quantity: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              paid: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/company/payments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              company: {
                count: number;
                months: number;
              };
              countCurrentYear: number | string;
              countLastYear: number | string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/dropbox/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              url: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/dropbox/{id}?': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/dropbox/auth/{code}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          code: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              token?: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/dropbox/token': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              token?: string;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/external/ical/{source}/{api}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          api: string;
          source: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/external/mollie/webhook': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            id: string;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/external/scale/{ident}/{api}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          action: 'CREATE' | 'CREATE_DEMO';
          datetime?: string;
          hum?: number;
          note?: string;
          rain?: number;
          temp1?: number;
          temp2?: number;
          weight?: number;
        };
        header?: never;
        path: {
          api: string;
          ident: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/feed/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                ai_created_at?: string | null;
                ai_deleted_at?: string | null;
                ai_updated_at?: string | null;
                amount?: number | null;
                bee_id?: number | null;
                charge?: string | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean | null;
                deleted_at?: string | null;
                disease?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                disease_id?: number | null;
                done?: boolean | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                enddate?: string | null;
                feed_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                frames?: number | null;
                harvest_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive?:
                  | ({
                      deleted?: boolean | null;
                      grouphive?: number | null;
                      id: number;
                      modus?: boolean | null;
                      name: string;
                      position?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                id: number;
                note?: string | null;
                temperature?: number | null;
                treatment_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
                vet?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                vet_id?: number | null;
                wait?: number | null;
                water?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number | null;
            charge?: string | null;
            date?: string;
            deleted?: boolean;
            disease_id?: number | null;
            done?: boolean;
            enddate?: string;
            frames?: number | null;
            hive_ids: number[];
            interval?: number;
            note?: string | null;
            repeat?: number;
            temperature?: number | null;
            type_id?: number | null;
            url?: string | null;
            vet_id?: number | null;
            wait?: number | null;
            water?: number | null;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              amount?: number | null;
              charge?: string | null;
              date?: string;
              deleted?: boolean;
              disease_id?: number | null;
              done?: boolean;
              enddate?: string;
              frames?: number | null;
              note?: string | null;
              temperature?: number | null;
              type_id?: number | null;
              url?: string | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/feed/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/feed/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/feed/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            end: string;
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/feed/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/field_setting/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json':
              | {
                  settings: {
                    [key: string]: unknown;
                  };
                }
              | false;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            settings: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/fieldsetting/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json':
              | {
                  settings: {
                    [key: string]: unknown;
                  };
                }
              | false;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            settings: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/harvest/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                ai_created_at?: string | null;
                ai_deleted_at?: string | null;
                ai_updated_at?: string | null;
                amount?: number | null;
                bee_id?: number | null;
                charge?: string | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean | null;
                deleted_at?: string | null;
                disease?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                disease_id?: number | null;
                done?: boolean | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                enddate?: string | null;
                feed_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                frames?: number | null;
                harvest_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive?:
                  | ({
                      deleted?: boolean | null;
                      grouphive?: number | null;
                      id: number;
                      modus?: boolean | null;
                      name: string;
                      position?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                id: number;
                note?: string | null;
                temperature?: number | null;
                treatment_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
                vet?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                vet_id?: number | null;
                wait?: number | null;
                water?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number | null;
            charge?: string | null;
            date?: string;
            deleted?: boolean;
            disease_id?: number | null;
            done?: boolean;
            enddate?: string;
            frames?: number | null;
            hive_ids: number[];
            interval?: number;
            note?: string | null;
            repeat?: number;
            temperature?: number | null;
            type_id?: number | null;
            url?: string | null;
            vet_id?: number | null;
            wait?: number | null;
            water?: number | null;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              amount?: number | null;
              charge?: string | null;
              date?: string;
              deleted?: boolean;
              disease_id?: number | null;
              done?: boolean;
              enddate?: string;
              frames?: number | null;
              note?: string | null;
              temperature?: number | null;
              type_id?: number | null;
              url?: string | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/harvest/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/harvest/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/harvest/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            end: string;
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/harvest/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/hive/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                bee_id?: number | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                deleted?: boolean | null;
                deleted_at?: string | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                grouphive?: number | null;
                hive_location?:
                  | ({
                      apiary_id: number;
                      apiary_name?: string | null;
                      hive_deleted?: boolean | null;
                      hive_id: number;
                      hive_modus?: boolean | null;
                      hive_name?: string | null;
                      move_id: number;
                      movedate?:
                        | ({
                            apiary_id?: number | null;
                            bee_id?: number | null;
                            created_at?: string | null;
                            date?: string | null;
                            edit_id?: number | null;
                            hive_id?: number | null;
                            id: number;
                            updated_at?: string | null;
                          } & {
                            [key: string]: unknown;
                          })
                        | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_source?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_type?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                id: number;
                modus?: boolean | null;
                modus_date?: string | null;
                name: string;
                note?: string | null;
                position?: number | null;
                queen_location?:
                  | ({
                      hive_id: number;
                      hive_name?: string | null;
                      queen?:
                        | ({
                            bee_id?: number | null;
                            created_at?: string | null;
                            date?: string | null;
                            deleted?: boolean | null;
                            deleted_at?: string | null;
                            edit_id?: number | null;
                            hive_id?: number | null;
                            id: number;
                            mark_colour?: string | null;
                            mating?:
                              | ({
                                  created_at?: string | null;
                                  favorite?: boolean | null;
                                  id: number;
                                  modus?: boolean | null;
                                  name?: string | null;
                                  updated_at?: string | null;
                                  user_id?: number | null;
                                } & {
                                  [key: string]: unknown;
                                })
                              | null;
                            mating_id?: number | null;
                            modus?: boolean | null;
                            modus_date?: string | null;
                            mother?: string | null;
                            mother_id?: number | null;
                            move_date?: string | null;
                            name: string;
                            note?: string | null;
                            race?:
                              | ({
                                  created_at?: string | null;
                                  favorite?: boolean | null;
                                  id: number;
                                  modus?: boolean | null;
                                  name?: string | null;
                                  updated_at?: string | null;
                                  user_id?: number | null;
                                } & {
                                  [key: string]: unknown;
                                })
                              | null;
                            race_id?: number | null;
                            updated_at?: string | null;
                            url?: string | null;
                            user_id?: number | null;
                          } & {
                            [key: string]: unknown;
                          })
                        | null;
                      queen_id?: number | null;
                      queen_mark_colour?: string | null;
                      queen_modus?: boolean | null;
                      queen_modus_date?: string | null;
                      queen_move_date?: string | null;
                      queen_name?: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                source_id?: number | null;
                type_id?: number | null;
                updated_at?: string | null;
                user_id?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiary_id: number;
            date: string;
            deleted?: boolean;
            /** @default 0 */
            grouphive?: number;
            modus?: boolean;
            modus_date?: string;
            name: string;
            note?: string;
            /** @default 0 */
            position?: number;
            repeat: number;
            source_id?: number;
            start: number;
            type_id?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              deleted?: boolean;
              /** @default 0 */
              grouphive?: number;
              modus?: boolean;
              modus_date?: string;
              name?: string;
              note?: string;
              /** @default 0 */
              position?: number;
              source_id?: number;
              type_id?: number;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/hive/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              firstMovedate?:
                | ({
                    apiary_id?: number | null;
                    bee_id?: number | null;
                    created_at?: string | null;
                    date?: string | null;
                    edit_id?: number | null;
                    hive_id?: number | null;
                    id: number;
                    updated_at?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              grouphive?: number | null;
              hive_location?:
                | ({
                    apiary_id: number;
                    apiary_name?: string | null;
                    hive_deleted?: boolean | null;
                    hive_id: number;
                    hive_modus?: boolean | null;
                    hive_name?: string | null;
                    move_id: number;
                    movedate?:
                      | ({
                          apiary_id?: number | null;
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          updated_at?: string | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_source?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              modus?: boolean | null;
              modus_date?: string | null;
              name: string;
              note?: string | null;
              position?: number | null;
              queen_location?:
                | ({
                    hive_id: number;
                    hive_name?: string | null;
                    queen?:
                      | ({
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          deleted?: boolean | null;
                          deleted_at?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          mark_colour?: string | null;
                          mating?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          mating_id?: number | null;
                          modus?: boolean | null;
                          modus_date?: string | null;
                          mother?: string | null;
                          mother_id?: number | null;
                          move_date?: string | null;
                          name: string;
                          note?: string | null;
                          race?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          race_id?: number | null;
                          updated_at?: string | null;
                          url?: string | null;
                          user_id?: number | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    queen_id?: number | null;
                    queen_mark_colour?: string | null;
                    queen_modus?: boolean | null;
                    queen_modus_date?: string | null;
                    queen_move_date?: string | null;
                    queen_name?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              sameLocation: ({
                id: number;
                name: string;
                position?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              source_id?: number | null;
              type_id?: number | null;
              updated_at?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/hive/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              grouphive?: number | null;
              hive_location?:
                | ({
                    apiary_id: number;
                    apiary_name?: string | null;
                    hive_deleted?: boolean | null;
                    hive_id: number;
                    hive_modus?: boolean | null;
                    hive_name?: string | null;
                    move_id: number;
                    movedate?:
                      | ({
                          apiary_id?: number | null;
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          updated_at?: string | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_source?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              modus?: boolean | null;
              modus_date?: string | null;
              name: string;
              note?: string | null;
              position?: number | null;
              queen_location?:
                | ({
                    hive_id: number;
                    hive_name?: string | null;
                    queen?:
                      | ({
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          deleted?: boolean | null;
                          deleted_at?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          mark_colour?: string | null;
                          mating?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          mating_id?: number | null;
                          modus?: boolean | null;
                          modus_date?: string | null;
                          mother?: string | null;
                          mother_id?: number | null;
                          move_date?: string | null;
                          name: string;
                          note?: string | null;
                          race?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          race_id?: number | null;
                          updated_at?: string | null;
                          url?: string | null;
                          user_id?: number | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    queen_id?: number | null;
                    queen_mark_colour?: string | null;
                    queen_modus?: boolean | null;
                    queen_modus_date?: string | null;
                    queen_move_date?: string | null;
                    queen_name?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              source_id?: number | null;
              type_id?: number | null;
              updated_at?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/hive/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              grouphive?: number | null;
              hive_location?:
                | ({
                    apiary_id: number;
                    apiary_name?: string | null;
                    hive_deleted?: boolean | null;
                    hive_id: number;
                    hive_modus?: boolean | null;
                    hive_name?: string | null;
                    move_id: number;
                    movedate?:
                      | ({
                          apiary_id?: number | null;
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          updated_at?: string | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_source?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              modus?: boolean | null;
              modus_date?: string | null;
              name: string;
              note?: string | null;
              position?: number | null;
              queen_location?:
                | ({
                    hive_id: number;
                    hive_name?: string | null;
                    queen?:
                      | ({
                          bee_id?: number | null;
                          created_at?: string | null;
                          date?: string | null;
                          deleted?: boolean | null;
                          deleted_at?: string | null;
                          edit_id?: number | null;
                          hive_id?: number | null;
                          id: number;
                          mark_colour?: string | null;
                          mating?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          mating_id?: number | null;
                          modus?: boolean | null;
                          modus_date?: string | null;
                          mother?: string | null;
                          mother_id?: number | null;
                          move_date?: string | null;
                          name: string;
                          note?: string | null;
                          race?:
                            | ({
                                created_at?: string | null;
                                favorite?: boolean | null;
                                id: number;
                                modus?: boolean | null;
                                name?: string | null;
                                updated_at?: string | null;
                                user_id?: number | null;
                              } & {
                                [key: string]: unknown;
                              })
                            | null;
                          race_id?: number | null;
                          updated_at?: string | null;
                          url?: string | null;
                          user_id?: number | null;
                        } & {
                          [key: string]: unknown;
                        })
                      | null;
                    queen_id?: number | null;
                    queen_mark_colour?: string | null;
                    queen_modus?: boolean | null;
                    queen_modus_date?: string | null;
                    queen_move_date?: string | null;
                    queen_name?: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              source_id?: number | null;
              type_id?: number | null;
              updated_at?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/hive/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/hive/task/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          apiary?: boolean;
          year?: number;
        };
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/hive/updatePosition': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              id: number;
              position: number;
            }[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/movedate/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                apiary?:
                  | ({
                      id: number;
                      name: string;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                apiary_id?: number | null;
                bee_id?: number | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive?:
                  | ({
                      id: number;
                      name: string;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                id: number;
                movedate_previous_apiary?: {
                  [key: string]: unknown;
                } | null;
                updated_at?: string | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiary_id: number;
            date: string;
            hive_ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              apiary_id?: number;
              date?: string;
              hive_id?: number;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/movedate/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/movedate/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              apiary?:
                | ({
                    id: number;
                    name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              apiary_id?: number | null;
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    id: number;
                    name: string;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              movedate_previous_apiary?: {
                [key: string]: unknown;
              } | null;
              updated_at?: string | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/movedate/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/openapi.json': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description Get OpenAPI specification for official b.tree clients. */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/option/{table}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          modus?: boolean | null;
          order?:
            | (
                | 'id'
                | 'name'
                | 'favorite'
                | 'modus'
                | 'created_at'
                | 'updated_at'
              )
            | (
                | 'id'
                | 'name'
                | 'favorite'
                | 'modus'
                | 'created_at'
                | 'updated_at'
              )[];
        };
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              created_at: string | null;
              favorite: boolean | null;
              id: number;
              modus: boolean | null;
              name: string | null;
              note?: string | null;
              stock?: {
                sum: (string | number) | null;
                sum_in: (string | number) | null;
                sum_out: (string | number) | null;
                type_id: number | null;
                user_id: number | null;
              } | null;
              unit?: string | null;
              updated_at: string | null;
              user_id: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            favorite?: boolean;
            modus?: boolean;
            name: string;
            note?: string | null;
            unit?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              created_at: string | null;
              favorite: boolean | null;
              id: number;
              modus: boolean | null;
              name: string | null;
              note?: string | null;
              stock?: {
                sum: (string | number) | null;
                sum_in: (string | number) | null;
                sum_out: (string | number) | null;
                type_id: number | null;
                user_id: number | null;
              } | null;
              unit?: string | null;
              updated_at: string | null;
              user_id: number | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              favorite?: boolean;
              modus?: boolean;
              name?: string;
              note?: string | null;
              unit?: string | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/option/{table}/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/option/{table}/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              created_at: string | null;
              favorite: boolean | null;
              id: number;
              modus: boolean | null;
              name: string | null;
              note?: string | null;
              stock?: {
                sum: (string | number) | null;
                sum_in: (string | number) | null;
                sum_out: (string | number) | null;
                type_id: number | null;
                user_id: number | null;
              } | null;
              unit?: string | null;
              updated_at: string | null;
              user_id: number | null;
            }[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/option/{table}/favorite': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/option/{table}/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          table:
            | 'charge_types'
            | 'hive_sources'
            | 'hive_types'
            | 'feed_types'
            | 'harvest_types'
            | 'checkup_types'
            | 'queen_matings'
            | 'queen_races'
            | 'treatment_diseases'
            | 'treatment_types'
            | 'treatment_vets'
            | 'wax_products'
            | 'wax_origin_types';
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/public/{taxa}/observations/recent': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          taxa: 'velutina' | 'aethina_tumida';
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              location: {
                x: number;
                y: number;
              };
              observed_at: string;
              uri: string;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/public/{taxa}/observations/stats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          taxa: 'velutina' | 'aethina_tumida';
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              count: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/public/{taxa}/observations/year/{year}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          taxa: 'velutina' | 'aethina_tumida';
          year: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              location: {
                x: number;
                y: number;
              };
              observed_at: string;
              uri: string;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/queen/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                bee_id?: number | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean | null;
                deleted_at?: string | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                hive_location?: {
                  [key: string]: unknown;
                } | null;
                id: number;
                mark_colour?: string | null;
                mating?: {
                  [key: string]: unknown;
                } | null;
                mating_id?: number | null;
                modus?: boolean | null;
                modus_date?: string | null;
                mother?: string | null;
                mother_id?: number | null;
                move_date?: string | null;
                name?: string | null;
                note?: string | null;
                own_mother?: {
                  [key: string]: unknown;
                } | null;
                queen_location?: {
                  [key: string]: unknown;
                } | null;
                race?: {
                  [key: string]: unknown;
                } | null;
                race_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            date?: string | null;
            hive_id?: number | number[];
            mark_colour?: string | null;
            mating_id?: number | null;
            modus?: boolean;
            modus_date?: string | null;
            mother?: string | null;
            mother_id?: number | null;
            move_date?: string | null;
            name: string;
            note?: string | null;
            race_id?: number | null;
            repeat?: number;
            start?: number;
            url?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              date?: string | null;
              hive_id?: 'empty' | null;
              mark_colour?: string | null;
              mating_id?: number | null;
              modus?: boolean;
              modus_date?: string | null;
              mother?: string | null;
              mother_id?: number | null;
              move_date?: string | null;
              name?: string;
              note?: string | null;
              race_id?: number | null;
              url?: string | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/queen/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              hive_location?: {
                [key: string]: unknown;
              } | null;
              id: number;
              mark_colour?: string | null;
              mating?: {
                [key: string]: unknown;
              } | null;
              mating_id?: number | null;
              modus?: boolean | null;
              modus_date?: string | null;
              mother?: string | null;
              mother_id?: number | null;
              move_date?: string | null;
              name?: string | null;
              note?: string | null;
              own_mother?: {
                [key: string]: unknown;
              } | null;
              queen_location?: {
                [key: string]: unknown;
              } | null;
              race?: {
                [key: string]: unknown;
              } | null;
              race_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/queen/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              bee_id?: number | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              hive_location?: {
                [key: string]: unknown;
              } | null;
              id: number;
              mark_colour?: string | null;
              mating?: {
                [key: string]: unknown;
              } | null;
              mating_id?: number | null;
              modus?: boolean | null;
              modus_date?: string | null;
              mother?: string | null;
              mother_id?: number | null;
              move_date?: string | null;
              name?: string | null;
              note?: string | null;
              own_mother?: {
                [key: string]: unknown;
              } | null;
              queen_location?: {
                [key: string]: unknown;
              } | null;
              race?: {
                [key: string]: unknown;
              } | null;
              race_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/queen/pedigree/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              id: number;
              name?: string | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/queen/stats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                id: number;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/queen/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_detail/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            hour?: number | null;
            job: string;
            note?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              hour?: number | null;
              job?: string;
              note?: string | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_detail/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_detail/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/rearing_step/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            detail_id?: number;
            position: number;
            sleep_after?: number;
            sleep_before?: number;
            type_id?: number;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/rearing_step/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/rearing_step/updatePosition': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              id: number;
              position: number;
              sleep_before: number;
            }[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_type/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name: string;
            note?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              name?: string;
              note?: string | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_type/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing_type/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/rearing/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            date: string;
            detail_id: number;
            hatch?: number | null;
            larvae?: number | null;
            mated?: number | null;
            name?: string | null;
            note?: string | null;
            symbol?: string | null;
            type_id: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              date?: string;
              detail_id?: number | null;
              hatch?: number | null;
              larvae?: number | null;
              mated?: number | null;
              name?: string | null;
              note?: string | null;
              symbol?: string | null;
              type_id?: number | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/rearing/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/rearing/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/report-violation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            violation?: unknown;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/scale_data/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          filters?: string;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'id'
                | 'scale.name'
                | 'scale.hive.name'
                | 'datetime'
                | 'weight'
                | 'temp1'
                | 'temp2'
                | 'humidity'
                | 'rain'
                | 'note'
              )
            | (
                | 'id'
                | 'scale.name'
                | 'scale.hive.name'
                | 'datetime'
                | 'weight'
                | 'temp1'
                | 'temp2'
                | 'humidity'
                | 'rain'
                | 'note'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                datetime: string | null;
                humidity: (string | number) | null;
                id: number;
                note: string | null;
                rain: (string | number) | null;
                scale?: {
                  hive: {
                    bee_id: number | null;
                    created_at: string | null;
                    deleted: boolean | null;
                    deleted_at: string | null;
                    edit_id: number | null;
                    grouphive: number | null;
                    id: number;
                    modus: boolean | null;
                    modus_date: string | null;
                    name: string | null;
                    note: string | null;
                    position: number | null;
                    source_id: number | null;
                    type_id: number | null;
                    updated_at: string | null;
                    user_id: number | null;
                  } | null;
                  hive_id: number | null;
                  id: number;
                  name: string | null;
                  user_id: number | null;
                };
                scale_id: number | null;
                temp1: (string | number) | null;
                temp2: (string | number) | null;
                weight: (string | number) | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            datetime: string;
            humidity?: (number | string) | null;
            note?: string | null;
            rain?: (number | string) | null;
            scale_id: number;
            temp1?: (number | string) | null;
            temp2?: (number | string) | null;
            weight?: (number | string) | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              datetime: string | null;
              humidity: (string | number) | null;
              id: number;
              note: string | null;
              rain: (string | number) | null;
              scale?: {
                hive: {
                  bee_id: number | null;
                  created_at: string | null;
                  deleted: boolean | null;
                  deleted_at: string | null;
                  edit_id: number | null;
                  grouphive: number | null;
                  id: number;
                  modus: boolean | null;
                  modus_date: string | null;
                  name: string | null;
                  note: string | null;
                  position: number | null;
                  source_id: number | null;
                  type_id: number | null;
                  updated_at: string | null;
                  user_id: number | null;
                } | null;
                hive_id: number | null;
                id: number;
                name: string | null;
                user_id: number | null;
              };
              scale_id: number | null;
              temp1: (string | number) | null;
              temp2: (string | number) | null;
              weight: (string | number) | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              datetime?: string;
              humidity?: (number | string) | null;
              note?: string | null;
              rain?: (number | string) | null;
              scale_id?: number;
              temp1?: (number | string) | null;
              temp2?: (number | string) | null;
              weight?: (number | string) | null;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/scale_data/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/scale_data/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              datetime: string | null;
              humidity: (string | number) | null;
              id: number;
              note: string | null;
              rain: (string | number) | null;
              scale?: {
                hive: {
                  bee_id: number | null;
                  created_at: string | null;
                  deleted: boolean | null;
                  deleted_at: string | null;
                  edit_id: number | null;
                  grouphive: number | null;
                  id: number;
                  modus: boolean | null;
                  modus_date: string | null;
                  name: string | null;
                  note: string | null;
                  position: number | null;
                  source_id: number | null;
                  type_id: number | null;
                  updated_at: string | null;
                  user_id: number | null;
                } | null;
                hive_id: number | null;
                id: number;
                name: string | null;
                user_id: number | null;
              };
              scale_id: number | null;
              temp1: (string | number) | null;
              temp2: (string | number) | null;
              weight: (string | number) | null;
            }[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/scale/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            hive_id: number;
            name: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              hive_id: number | null;
              id: number;
              name: string;
              user_id: number | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              hive_id?: number;
              name?: string;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/scale/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/scale/{id}?': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              hive: {
                [key: string]: unknown;
              } | null;
              hive_id: number | null;
              id: number;
              name: string;
              user_id: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/elevation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          latitude: number;
          longitude: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/gruenlandtemperatursumme/{apiary_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          apiary_id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/map/american_foulbrood': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/mollie/orders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount: number;
            quantity: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/paypal/orders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount: number;
            quantity: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/paypal/orders/{orderID}/capture': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          orderID: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/service/temperature/{apiary_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          apiary_id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/feed/apiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/feed/hive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          filters?: string;
          groupByType?: boolean;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                amount_avg?: (string | number) | null;
                amount_sum?: (string | number) | null;
                brood?: (string | number) | null;
                calm_comb?: (string | number) | null;
                comb?: (string | number) | null;
                frames_avg?: (string | number) | null;
                frames_sum?: (string | number) | null;
                hive?: {
                  id: number;
                  name: string | null;
                } & {
                  [key: string]: unknown;
                };
                hive_count?: (string | number) | null;
                hive_id?: number | null;
                pollen?: (string | number) | null;
                strong?: (string | number) | null;
                swarm?: (string | number) | null;
                task_apiary?:
                  | ({
                      apiary_id: number | null;
                      apiary_name: string | null;
                      user_id: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                temper?: (string | number) | null;
                type?:
                  | ({
                      id: number;
                      name: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                varroa?: (string | number) | null;
                water_avg?: (string | number) | null;
                year?: number | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/feed/type': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/feed/year': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/harvest/apiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/harvest/hive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          filters?: string;
          groupByType?: boolean;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                amount_avg?: (string | number) | null;
                amount_sum?: (string | number) | null;
                brood?: (string | number) | null;
                calm_comb?: (string | number) | null;
                comb?: (string | number) | null;
                frames_avg?: (string | number) | null;
                frames_sum?: (string | number) | null;
                hive?: {
                  id: number;
                  name: string | null;
                } & {
                  [key: string]: unknown;
                };
                hive_count?: (string | number) | null;
                hive_id?: number | null;
                pollen?: (string | number) | null;
                strong?: (string | number) | null;
                swarm?: (string | number) | null;
                task_apiary?:
                  | ({
                      apiary_id: number | null;
                      apiary_name: string | null;
                      user_id: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                temper?: (string | number) | null;
                type?:
                  | ({
                      id: number;
                      name: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                varroa?: (string | number) | null;
                water_avg?: (string | number) | null;
                year?: number | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/harvest/type': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/harvest/year': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/hive_count_apiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          date: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              apiary_id: number | null;
              name: string | null;
              total: (string | number) | null;
              user_id: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/hive_count_total': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              change: number;
              decrease?: (string | number) | null;
              ident: string;
              increase?: (string | number) | null;
              quarter: number;
              total: number;
              user_id?: number | null;
              year: number;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/rating/hive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          filters?: string;
          groupByType?: boolean;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                amount_avg?: (string | number) | null;
                amount_sum?: (string | number) | null;
                brood?: (string | number) | null;
                calm_comb?: (string | number) | null;
                comb?: (string | number) | null;
                frames_avg?: (string | number) | null;
                frames_sum?: (string | number) | null;
                hive?: {
                  id: number;
                  name: string | null;
                } & {
                  [key: string]: unknown;
                };
                hive_count?: (string | number) | null;
                hive_id?: number | null;
                pollen?: (string | number) | null;
                strong?: (string | number) | null;
                swarm?: (string | number) | null;
                task_apiary?:
                  | ({
                      apiary_id: number | null;
                      apiary_name: string | null;
                      user_id: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                temper?: (string | number) | null;
                type?:
                  | ({
                      id: number;
                      name: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                varroa?: (string | number) | null;
                water_avg?: (string | number) | null;
                year?: number | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/treatment/apiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/treatment/hive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          filters?: string;
          groupByType?: boolean;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )
            | (
                | 'hive_id'
                | 'year'
                | 'hive.name'
                | 'amount_sum'
                | 'amount_avg'
                | 'frames_sum'
                | 'frames_avg'
                | 'water_avg'
                | 'brood'
                | 'pollen'
                | 'comb'
                | 'temper'
                | 'calm_comb'
                | 'swarm'
                | 'varroa'
                | 'strong'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                amount_avg?: (string | number) | null;
                amount_sum?: (string | number) | null;
                brood?: (string | number) | null;
                calm_comb?: (string | number) | null;
                comb?: (string | number) | null;
                frames_avg?: (string | number) | null;
                frames_sum?: (string | number) | null;
                hive?: {
                  id: number;
                  name: string | null;
                } & {
                  [key: string]: unknown;
                };
                hive_count?: (string | number) | null;
                hive_id?: number | null;
                pollen?: (string | number) | null;
                strong?: (string | number) | null;
                swarm?: (string | number) | null;
                task_apiary?:
                  | ({
                      apiary_id: number | null;
                      apiary_name: string | null;
                      user_id: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                temper?: (string | number) | null;
                type?:
                  | ({
                      id: number;
                      name: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                varroa?: (string | number) | null;
                water_avg?: (string | number) | null;
                year?: number | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/treatment/type': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/treatment/year': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          filters?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              amount_avg?: (string | number) | null;
              amount_sum?: (string | number) | null;
              brood?: (string | number) | null;
              calm_comb?: (string | number) | null;
              comb?: (string | number) | null;
              frames_avg?: (string | number) | null;
              frames_sum?: (string | number) | null;
              hive?: {
                id: number;
                name: string | null;
              } & {
                [key: string]: unknown;
              };
              hive_count?: (string | number) | null;
              hive_id?: number | null;
              pollen?: (string | number) | null;
              strong?: (string | number) | null;
              swarm?: (string | number) | null;
              task_apiary?:
                | ({
                    apiary_id: number | null;
                    apiary_name: string | null;
                    user_id: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              temper?: (string | number) | null;
              type?:
                | ({
                    id: number;
                    name: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              varroa?: (string | number) | null;
              water_avg?: (string | number) | null;
              year?: number | null;
            }[];
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/statistic/varroa': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query: {
          end_date: string;
          hive_ids: number | number[];
          start_date: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              datasetCheckup: {
                [key: string]: (string | number | null)[][];
              };
              datasetTreatment: {
                [key: string]: (string | number | null)[][];
              };
              stats: {
                hive_name: string;
                varroa: {
                  avg: number;
                  max: number;
                  min: number;
                };
              }[];
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/todo/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          apiary_id?: number;
          direction?: ('asc' | 'desc') | ('asc' | 'desc')[];
          done?: boolean | null;
          filters?: string;
          limit?: number;
          offset?: number;
          order?:
            | (
                | 'id'
                | 'date'
                | 'name'
                | 'apiary'
                | 'url'
                | 'note'
                | 'done'
                | 'created_at'
                | 'updated_at'
              )
            | (
                | 'id'
                | 'date'
                | 'name'
                | 'apiary'
                | 'url'
                | 'note'
                | 'done'
                | 'created_at'
                | 'updated_at'
              )[];
          q?: string | number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                apiary?: {
                  modus: boolean;
                  name: string;
                } | null;
                apiary_id: number | null;
                bee_id: number | null;
                created_at: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date: string;
                done: boolean;
                edit_id: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                id: number;
                name: string;
                note: string | null;
                updated_at: string | null;
                url: string | null;
                user_id: number | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiary_id?: number;
            date: string;
            done?: boolean;
            interval?: number;
            name: string;
            note?: string;
            repeat?: number;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              apiary_id?: number;
              date?: string;
              done?: boolean;
              name?: string;
              note?: string;
              url?: string;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/todo/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/todo/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              apiary?: {
                modus: boolean;
                name: string;
              } | null;
              apiary_id: number | null;
              bee_id: number | null;
              created_at: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date: string;
              done: boolean;
              edit_id: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              id: number;
              name: string;
              note: string | null;
              updated_at: string | null;
              url: string | null;
              user_id: number | null;
            }[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/todo/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/todo/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/treatment/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: ({
                ai_created_at?: string | null;
                ai_deleted_at?: string | null;
                ai_updated_at?: string | null;
                amount?: number | null;
                bee_id?: number | null;
                charge?: string | null;
                created_at?: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date?: string | null;
                deleted?: boolean | null;
                deleted_at?: string | null;
                disease?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                disease_id?: number | null;
                done?: boolean | null;
                edit_id?: number | null;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                enddate?: string | null;
                feed_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                frames?: number | null;
                harvest_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive?:
                  | ({
                      deleted?: boolean | null;
                      grouphive?: number | null;
                      id: number;
                      modus?: boolean | null;
                      name: string;
                      position?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hive_id?: number | null;
                id: number;
                note?: string | null;
                temperature?: number | null;
                treatment_apiary?:
                  | ({
                      apiary_id: number;
                      apiary_name: string;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                type_id?: number | null;
                updated_at?: string | null;
                url?: string | null;
                user_id?: number | null;
                vet?:
                  | ({
                      created_at?: string | null;
                      favorite?: boolean | null;
                      id: number;
                      modus?: boolean | null;
                      name?: string | null;
                      updated_at?: string | null;
                      user_id?: number | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                vet_id?: number | null;
                wait?: number | null;
                water?: number | null;
              } & {
                [key: string]: unknown;
              })[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number | null;
            charge?: string | null;
            date?: string;
            deleted?: boolean;
            disease_id?: number | null;
            done?: boolean;
            enddate?: string;
            frames?: number | null;
            hive_ids: number[];
            interval?: number;
            note?: string | null;
            repeat?: number;
            temperature?: number | null;
            type_id?: number | null;
            url?: string | null;
            vet_id?: number | null;
            wait?: number | null;
            water?: number | null;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            data: {
              amount?: number | null;
              charge?: string | null;
              date?: string;
              deleted?: boolean;
              disease_id?: number | null;
              done?: boolean;
              enddate?: string;
              frames?: number | null;
              note?: string | null;
              temperature?: number | null;
              type_id?: number | null;
              url?: string | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            };
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/treatment/batchDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/treatment/batchGet': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': ({
              ai_created_at?: string | null;
              ai_deleted_at?: string | null;
              ai_updated_at?: string | null;
              amount?: number | null;
              bee_id?: number | null;
              charge?: string | null;
              created_at?: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date?: string | null;
              deleted?: boolean | null;
              deleted_at?: string | null;
              disease?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              disease_id?: number | null;
              done?: boolean | null;
              edit_id?: number | null;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              enddate?: string | null;
              feed_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              frames?: number | null;
              harvest_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive?:
                | ({
                    deleted?: boolean | null;
                    grouphive?: number | null;
                    id: number;
                    modus?: boolean | null;
                    name: string;
                    position?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hive_id?: number | null;
              id: number;
              note?: string | null;
              temperature?: number | null;
              treatment_apiary?:
                | ({
                    apiary_id: number;
                    apiary_name: string;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              type_id?: number | null;
              updated_at?: string | null;
              url?: string | null;
              user_id?: number | null;
              vet?:
                | ({
                    created_at?: string | null;
                    favorite?: boolean | null;
                    id: number;
                    modus?: boolean | null;
                    name?: string | null;
                    updated_at?: string | null;
                    user_id?: number | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              vet_id?: number | null;
              wait?: number | null;
              water?: number | null;
            } & {
              [key: string]: unknown;
            })[];
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/treatment/date': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            end: string;
            ids: number[];
            start: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/treatment/status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
            status: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': number;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/user/': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            acdate?: boolean;
            email?: string;
            format?: string;
            lang?: string;
            newPassword?: string;
            newsletter?: boolean;
            password?: string;
            saved_company?: number;
            sound?: boolean;
            todo?: boolean;
            username?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/user/checkpassword': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            password: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/user/company': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            saved_company: number;
          } & {
            [key: string]: unknown;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/user/delete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            password: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    trace?: never;
  };
  '/v1/user/federatedCredentials': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
            /**
             * @default google
             * @enum {string}
             */
            provider?: 'google' | 'apple';
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/user/federatedCredentials/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/user/session': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/user/session/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path: {
          id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/lots': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          as_of?: string;
          limit?: number;
          offset?: number;
          q?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                code: string;
                created_at: string | null;
                created_by_operation_id: number | null;
                id: number;
                note: string | null;
                product_id: number | null;
                product_name: string | null;
                reference: string | null;
                stock_kg: number;
                updated_at: string | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/lots/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': boolean;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/operations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          from?: string;
          limit?: number;
          offset?: number;
          q?: string;
          to?: string;
          type?:
            | 'production'
            | 'purchase'
            | 'processing'
            | 'contract_processing'
            | 'use'
            | 'sale'
            | 'correction';
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              results: {
                counterparty: string | null;
                created_at: string | null;
                creator?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                date: string;
                difference_kg: number;
                editor?:
                  | ({
                      email: string | null;
                      id: number;
                      username: string | null;
                    } & {
                      [key: string]: unknown;
                    })
                  | null;
                hives: {
                  apiary_id: number | null;
                  apiary_name: string | null;
                  id: number;
                  name: string;
                }[];
                id: number;
                input_kg: number;
                inventory_counts: {
                  adjustment_kg: number;
                  counted_quantity_kg: number;
                  id: number;
                  ledger_quantity_kg: number;
                  lot_code: string;
                  lot_id: number;
                  product_id: number | null;
                  product_name: string | null;
                }[];
                lines: {
                  /** @enum {string} */
                  direction: 'input' | 'output';
                  id: number;
                  lot_code: string;
                  lot_id: number;
                  product_id: number | null;
                  product_name: string | null;
                  quantity_kg: number;
                }[];
                note: string | null;
                origin_type_id: number | null;
                origin_type_name: string | null;
                output_kg: number;
                reference: string | null;
                reversal_of_id: number | null;
                /** @enum {string} */
                type:
                  | 'production'
                  | 'purchase'
                  | 'processing'
                  | 'contract_processing'
                  | 'use'
                  | 'sale'
                  | 'correction';
                updated_at: string | null;
                url: string | null;
              }[];
              total: number;
            };
          };
        };
      };
    };
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            counterparty?: string | null;
            /** Format: date */
            date: string;
            hive_ids?: number[];
            inputs?: {
              lot_id: number;
              quantity_kg: number;
            }[];
            note?: string | null;
            origin_type_id?: number | null;
            outputs?: {
              code?: string;
              lot_id?: number;
              note?: string | null;
              product_id?: number;
              quantity_kg: number;
            }[];
            reference?: string | null;
            /** @enum {string} */
            type:
              | 'production'
              | 'purchase'
              | 'processing'
              | 'contract_processing'
              | 'use'
              | 'sale';
            url?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              counterparty: string | null;
              created_at: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date: string;
              difference_kg: number;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hives: {
                apiary_id: number | null;
                apiary_name: string | null;
                id: number;
                name: string;
              }[];
              id: number;
              input_kg: number;
              inventory_counts: {
                adjustment_kg: number;
                counted_quantity_kg: number;
                id: number;
                ledger_quantity_kg: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
              }[];
              lines: {
                /** @enum {string} */
                direction: 'input' | 'output';
                id: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
                quantity_kg: number;
              }[];
              note: string | null;
              origin_type_id: number | null;
              origin_type_name: string | null;
              output_kg: number;
              reference: string | null;
              reversal_of_id: number | null;
              /** @enum {string} */
              type:
                | 'production'
                | 'purchase'
                | 'processing'
                | 'contract_processing'
                | 'use'
                | 'sale'
                | 'correction';
              updated_at: string | null;
              url: string | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/operations/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': boolean;
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/operations/{id}/reverse': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          id: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              counterparty: string | null;
              created_at: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date: string;
              difference_kg: number;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hives: {
                apiary_id: number | null;
                apiary_name: string | null;
                id: number;
                name: string;
              }[];
              id: number;
              input_kg: number;
              inventory_counts: {
                adjustment_kg: number;
                counted_quantity_kg: number;
                id: number;
                ledger_quantity_kg: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
              }[];
              lines: {
                /** @enum {string} */
                direction: 'input' | 'output';
                id: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
                quantity_kg: number;
              }[];
              note: string | null;
              origin_type_id: number | null;
              origin_type_name: string | null;
              output_kg: number;
              reference: string | null;
              reversal_of_id: number | null;
              /** @enum {string} */
              type:
                | 'production'
                | 'purchase'
                | 'processing'
                | 'contract_processing'
                | 'use'
                | 'sale'
                | 'correction';
              updated_at: string | null;
              url: string | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wax/operations/inventory': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            counts?: {
              counted_quantity_kg: number;
              lot_id: number;
            }[];
            /** Format: date */
            date: string;
            note: string;
            opening_stocks?: {
              code?: string;
              counted_quantity_kg: number;
              product_id: number;
            }[];
            reference?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              counterparty: string | null;
              created_at: string | null;
              creator?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              date: string;
              difference_kg: number;
              editor?:
                | ({
                    email: string | null;
                    id: number;
                    username: string | null;
                  } & {
                    [key: string]: unknown;
                  })
                | null;
              hives: {
                apiary_id: number | null;
                apiary_name: string | null;
                id: number;
                name: string;
              }[];
              id: number;
              input_kg: number;
              inventory_counts: {
                adjustment_kg: number;
                counted_quantity_kg: number;
                id: number;
                ledger_quantity_kg: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
              }[];
              lines: {
                /** @enum {string} */
                direction: 'input' | 'output';
                id: number;
                lot_code: string;
                lot_id: number;
                product_id: number | null;
                product_name: string | null;
                quantity_kg: number;
              }[];
              note: string | null;
              origin_type_id: number | null;
              origin_type_name: string | null;
              output_kg: number;
              reference: string | null;
              reversal_of_id: number | null;
              /** @enum {string} */
              type:
                | 'production'
                | 'purchase'
                | 'processing'
                | 'contract_processing'
                | 'use'
                | 'sale'
                | 'correction';
              updated_at: string | null;
              url: string | null;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/ask/stream': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            history?: {
              content: string;
              /** @enum {string} */
              role: 'user' | 'model' | 'tool';
              toolDone?: boolean;
              toolInput?: string;
              toolName?: string;
              toolOutput?: string;
            }[];
            question: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content?: never;
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/apiaryWeather': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get weather and GTS for a specific apiary. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId: number;
            year?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/batchDeleteTodo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Delete one or more todos by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/btreeDocumentation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Fetch b.tree software documentation. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            query?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/calculateSugarWater': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Calculate sugar water mixture for bee feeding. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @enum {string} */
            ratio: '1:1' | '3:2';
            sugar?: number;
            water?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createApiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new apiary. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            description?: string;
            elevation?: number | null;
            latitude?: number;
            longitude?: number;
            modus?: boolean;
            name: string;
            note?: string;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createCharge': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new charge/stock entry (sugar, treatments, honey jars, etc.). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            bestbefore?: string;
            charge?: string;
            date: string;
            kind?: string;
            name: string;
            note?: string;
            price?: number;
            typeId?: number;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createCheckup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new checkup/inspection record for one or more hives. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            brood?: number;
            broodframes?: number;
            calmComb?: number;
            cappedBrood?: boolean;
            comb?: number;
            date: string;
            done?: boolean;
            eggs?: boolean;
            emptyframes?: number;
            enddate?: string;
            foundation?: number;
            hiveIds: number[];
            honeyframes?: number;
            interval?: number;
            note?: string;
            pollen?: number;
            queen?: boolean;
            queencells?: boolean;
            repeat?: number;
            strong?: number;
            swarm?: number;
            temper?: number;
            temperature?: number;
            typeId?: number;
            varroa?: number;
            weight?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createFeed': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new feed record for one or more hives. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            date: string;
            done?: boolean;
            enddate?: string;
            hiveIds: number[];
            interval?: number;
            note?: string;
            repeat?: number;
            typeId?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createHarvest': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new harvest record for one or more hives. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            charge?: string;
            date: string;
            done?: boolean;
            enddate?: string;
            frames?: number;
            hiveIds: number[];
            interval?: number;
            note?: string;
            repeat?: number;
            typeId?: number;
            water?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createHive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create one hive with its required apiary connection and initial movement. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId: number;
            /** @default 0 */
            groupHive?: number;
            initialMovementDate: string;
            modus?: boolean;
            modusDate?: string;
            name: string;
            note?: string;
            /** @default 0 */
            position?: number;
            sourceId?: number;
            typeId?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createMovement': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a movement for one hive to an existing apiary. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId: number;
            date: string;
            hiveId: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createTodo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new todo/reminder. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId?: number;
            date: string;
            interval?: number;
            name: string;
            note?: string;
            repeat?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createTreatment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a new treatment record for one or more hives. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            date: string;
            diseaseId?: number;
            done?: boolean;
            enddate?: string;
            hiveIds: number[];
            interval?: number;
            note?: string;
            repeat?: number;
            temperature?: number;
            typeId?: number;
            vetId?: number;
            wait?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/createWaxOperation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Create a wax ledger operation. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @description Supplier or processor */
            counterparty?: string | null;
            /**
             * Format: date
             * @description Booking date
             */
            date: string;
            /**
             * @description Optional source hive IDs from findHives
             * @default []
             */
            hiveIds?: number[];
            /**
             * @description Consumed wax lot quantities
             * @default []
             */
            inputs?: {
              /** @description Existing input lot ID from fetchWaxLedger */
              lotId: number;
              /** @description Input quantity in kg */
              quantityKg: number;
            }[];
            /** @description Reason or explanation */
            note?: string | null;
            /** @description Wax origin type ID from fetchOptions; required for production */
            originTypeId?: number | null;
            /**
             * @description Produced or purchased wax lot quantities
             * @default []
             */
            outputs?: {
              /** @description New lot code; generated automatically when omitted */
              code?: string;
              /** @description Existing output lot ID; omit when creating a new lot */
              lotId?: number;
              note?: string | null;
              /** @description Wax product ID from fetchOptions for a new lot */
              productId?: number;
              /** @description Output quantity in kg */
              quantityKg: number;
            }[];
            /** @description Document, invoice or order number */
            reference?: string | null;
            /**
             * @description Wax operation type
             * @enum {string}
             */
            type:
              | 'production'
              | 'purchase'
              | 'processing'
              | 'contract_processing'
              | 'use'
              | 'sale';
            url?: string | null;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/deleteMovement': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Delete one movement by its ID. Cannot delete a hive’s last movement. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            id: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/fetchCharges': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Fetch charges (stock/inventory entries). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @default false */
            includeDeleted?: boolean;
            /** @default 100 */
            limit?: number;
            q?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/fetchOptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Fetch all available option/lookup lists at once (hive types, task types, wax products, wax origin types, etc.). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @default true */
            activeOnly?: boolean;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/fetchTasks': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Fetch individual task records (feed, treatment, harvest, checkup, todo) within a date range. For multi-year summaries prefer the statistics tools. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId?: number;
            dateEnd?: string;
            dateStart?: string;
            /** @default true */
            includeDone?: boolean;
            /** @default 200 */
            limit?: number;
            /** @enum {string} */
            task: 'feed' | 'treatment' | 'harvest' | 'checkup' | 'todo';
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/fetchWaxLedger': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Fetch wax lots, current stock, product summary and wax operations. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /**
             * Format: date
             * @description Last operation date
             */
            dateEnd?: string;
            /**
             * Format: date
             * @description First operation date
             */
            dateStart?: string;
            /**
             * @description Include lots whose current stock is zero
             * @default false
             */
            includeEmpty?: boolean;
            /**
             * @description Maximum lots and operations to return
             * @default 100
             */
            limit?: number;
            /**
             * @description Operation type filter
             * @enum {string}
             */
            operationType?:
              | 'production'
              | 'purchase'
              | 'processing'
              | 'contract_processing'
              | 'use'
              | 'sale'
              | 'correction';
            /** @description Search text */
            q?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getFeedStatistics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get feed statistics (by year, apiary, type). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            year?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getHarvestStatistics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get harvest statistics (by year, apiary, type). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            year?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getHiveDetail': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get a detailed static summary for a single hive (queen, location, type, source, neighbours). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            hiveId: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getHiveStatistics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get hive count statistics (total and per apiary). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            date?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getHiveTasks': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get all tasks (feed, harvest, treatment, checkup, movedate, todo) for a hive or apiary for a given year. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @default false */
            apiary?: boolean;
            id: number;
            year?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/getTreatmentStatistics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Get treatment statistics (by year, apiary, type). */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            year?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/listApiariesHives': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description List all apiaries and their hives for the current user. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @default false */
            includeInactive?: boolean;
            q?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/listMovements': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description List hive movements with optional filters. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId?: number;
            dateEnd?: string;
            dateStart?: string;
            hiveId?: number;
            /** @default 100 */
            limit?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchApiary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update an existing apiary by its ID. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            description?: string;
            elevation?: number | null;
            id: number;
            latitude?: number;
            longitude?: number;
            modus?: boolean;
            name?: string;
            note?: string;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchCharge': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing charge/stock records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            bestbefore?: string;
            charge?: string;
            date?: string;
            ids: number[];
            kind?: string;
            name?: string;
            note?: string;
            price?: number;
            typeId?: number;
            url?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchCheckup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing checkup/inspection records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            brood?: number;
            broodframes?: number;
            calmComb?: number;
            cappedBrood?: boolean;
            comb?: number;
            date?: string;
            done?: boolean;
            eggs?: boolean;
            emptyframes?: number;
            enddate?: string;
            foundation?: number;
            honeyframes?: number;
            ids: number[];
            note?: string;
            pollen?: number;
            queen?: boolean;
            queencells?: boolean;
            strong?: number;
            swarm?: number;
            temper?: number;
            temperature?: number;
            typeId?: number;
            varroa?: number;
            weight?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchFeed': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing feed records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            date?: string;
            done?: boolean;
            enddate?: string;
            ids: number[];
            note?: string;
            typeId?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchHarvest': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing harvest records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            charge?: string;
            date?: string;
            done?: boolean;
            enddate?: string;
            frames?: number;
            ids: number[];
            note?: string;
            typeId?: number;
            water?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchHive': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update an existing hive by its ID. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            groupHive?: number;
            hiveId: number;
            modus?: boolean;
            modusDate?: string;
            name?: string;
            note?: string;
            position?: number;
            sourceId?: number;
            typeId?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchMovement': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update an existing movement by its ID. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId?: number;
            date?: string;
            id: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchTodo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing todos by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            apiaryId?: number;
            date?: string;
            done?: boolean;
            ids: number[];
            name?: string;
            note?: string;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/patchTreatment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Update one or more existing treatment records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            amount?: number;
            date?: string;
            diseaseId?: number;
            done?: boolean;
            enddate?: string;
            ids: number[];
            note?: string;
            temperature?: number;
            typeId?: number;
            vetId?: number;
            wait?: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/reverseWaxOperation': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Reverse a wax operation through an auditable correction entry. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @description Wax operation ID from fetchWaxLedger */
            operationId: number;
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/softDeleteCharge': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Soft-delete one or more charge/stock records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/softDeleteCheckup': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Soft-delete one or more checkup/inspection records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/softDeleteFeed': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Soft-delete one or more feed records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/softDeleteHarvest': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Soft-delete one or more harvest records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/tools/softDeleteTreatment': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Soft-delete one or more treatment records by their IDs. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            ids: number[];
          };
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/transcribe': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': unknown;
        };
      };
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/wizbee/usage': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: {
      parameters: {
        query?: {
          action?: string | null;
          apiary?: number | null;
          date?: string | null;
          datetime?: string | null;
          deleted?: boolean | null;
          details?: boolean | null;
          direction?: (('asc' | 'desc') | ('asc' | 'desc')[]) | null;
          done?: boolean | null;
          end?: string | null;
          end_date?: string | null;
          filters?: string | null;
          from?: string | null;
          hard?: boolean | null;
          hum?: string | null;
          latest?: boolean | null;
          latitude?: string | null;
          limit?: number | null;
          longitude?: string | null;
          modus?: boolean | null;
          note?: string | null;
          offset?: number | null;
          order?: (string | string[]) | null;
          q?: string | null;
          rain?: string | null;
          restore?: boolean | null;
          start?: string | null;
          start_date?: string | null;
          temp1?: string | null;
          temp2?: string | null;
          to?: string | null;
          type?: number | null;
          weight?: string | null;
          year?: number | null;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description Default Response */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': unknown;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: never;
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
