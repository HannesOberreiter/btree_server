import { BaseOptionModel } from '@models/option/baseoption.model';
import { ExtModel } from '../base.model';
import { Company } from '../company.model';

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
