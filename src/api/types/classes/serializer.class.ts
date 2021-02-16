import { Request } from "express";
import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import { Deserializer as JsonApiDeserializer } from "jsonapi-serializer";
import { expectationFailed } from "boom";

/**
 * Implements json-api serializing / unserializing process 
 */
export abstract class Serializer {

  /**
   * @description Object instance type
   */
  protected type;
  
  /**
   * @description List of authorized fields to include
   */
  protected withelist;

  /**
   * @description Definition of embeded relations
   */
  protected relationships;

  /**
   * 
   */
  private serializes: Function;

  /**
   * 
   */
  private deserializes: Function;

  /**
   * @param {String} type Object instance type
   * @param {Array<String>} whitelist List of authorized fields to include
   * @param {Object} relations Description of embeded relations
   * @param {Object} relationships 
   */
  constructor(type: String, whitelist: Array<String>, relations: Object, relationships: Object) {  

    this.type = type;
    this.withelist = whitelist;
    this.relationships = relationships;

    let serializerOptions = {
      id: 'id',
      attributes: whitelist
    };

    for(let key in relations)
    {
      serializerOptions[key] = relations[key];
    }
    
    this.serializes = new JsonApiSerializer(type, serializerOptions).serialize;

    let deserializerOptions = {
      attributes: whitelist,
      keyForAttribute: "underscore_case"
    };

    for(let key in relationships)
    {
      deserializerOptions[key] = relationships[key];
    }

    this.deserializes = new JsonApiDeserializer(deserializerOptions).deserialize;
  }

  /**
   * @description Serialize an entity for output according to json-api
   * 
   * @param {Object} payload Data to serialize
   * @throws {Error} Expectation failed (417)
   */
  public serialize = async (payload: any) => {
    try {
      if(Array.isArray(payload)) { return payload.map( entry => this.serializes(entry)); }
      return await this.serializes(payload);
    }
    catch(e) { throw expectationFailed(e.message) }
  }

  /**
   * @description Unserialize a payload according to json-api from HTTP request
   * 
   * @param {Request} req Current request object
   * @throws {Error} Expectation failed (417)
   */
  public deserialize = async(req: Request) => {
    try {
      return await this.deserializes(req.body);
    } 
    catch (e) { throw expectationFailed(e.message); }
  }

}