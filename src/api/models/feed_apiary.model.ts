import { Company } from './company.model.js';
import { Feed } from './feed.model.js';
import { Model } from 'objection';

export class FeedApiary extends Model {
  apiary_id!: number;
  apiary_name!: string;
  user_id!: number;
  feed_id!: number;
  feed_date!: string;

  company?: Company;
  feed?: Feed;

  static tableName = 'feeds_apiaries';
  static idColumn = 'feed_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'feeds_apiaries.user_id',
        to: 'companies.id',
      },
    },
    feed: {
      relation: Model.BelongsToOneRelation,
      modelClass: Feed,
      join: {
        from: 'feeds_apiaries.feed_id',
        to: 'feeds.id',
      },
    },
  });
}
