import { IFieldError } from "@interfaces/IFieldError.interface";

/**
 * Define error output format
 */
export interface IError {

  /**
   * @description HTTP response status code
   */
  statusCode: number;

  /**
   * @description HTTP response status message
   */
  statusText: string;

  /**
   * @description HTTP response errors
   */
  errors: Array<IFieldError|string>;
};