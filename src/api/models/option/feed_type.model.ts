import { ExtModel } from '../base.model.js';
import { Company } from '../company.model.js';
import { BaseOptionModel } from './baseoption.model.js';

export class FeedType extends BaseOptionModel {
  static tableName = 'feed_types';

  constructor() {
    super();
  }

  static relationMappings = {
    company: {
      relation: ExtModel.HasOneRelation,
      modelClass: Company,
      join: {
        from: ['feed_types.user_id'],
        to: ['companies.id'],
      },
    },
  };
}
