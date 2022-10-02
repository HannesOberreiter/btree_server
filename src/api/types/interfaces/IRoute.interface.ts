import { Router } from '../classes/router.class';

/**
 * Define route definition members
 */
export interface IRoute {
  /**
   * @description URI segment
   */
  segment: string;

  /**
   * @description Router definition or Router concrete instance
   */
  router: any | Router;
}
