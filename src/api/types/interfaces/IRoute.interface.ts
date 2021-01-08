import { Router } from "@base/api/types/classes/router.class";

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
  router: any|Router;

  /**
   * @description Indicates if the route response must be serialized
   */
  serializable: boolean;
};