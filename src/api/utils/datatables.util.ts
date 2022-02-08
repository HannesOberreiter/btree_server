import { CheckupApiary } from '@models/checkup_apiary.model';

const filterIds = (obj) => {
  let ids = [];
  Object.keys(obj).map(function (key, _index) {
    ids.push(key.replace('row_', ''));
  });
  return ids;
};

const checkItemUser = async (obj, { user }) => {
  const ids = filterIds(obj);
  const dbCheck = await CheckupApiary.query()
    .findByIds(ids)
    .where('user_id', user.user_id);
  if (dbCheck.length === ids.length) return true;
  return false;
};

export { checkItemUser };
