//require('ts-node').register()
require('module-alias/register');
import { ENVIRONMENT } from '@root/api/types/enums/environment.enum';
import { env, knexConfig } from "@root/config/environment.config";
console.log(ENVIRONMENT);
console.log(knexConfig);
console.log(env);
module.exports = knexConfig
