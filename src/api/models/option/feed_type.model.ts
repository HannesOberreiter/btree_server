import { BaseOptionModel } from '@models/option/baseoption.model';

export class FeedType extends BaseOptionModel {
  static tableName = 'feed_types';

  constructor() {
    super();
  }
}
