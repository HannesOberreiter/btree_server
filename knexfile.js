//import { ENVIRONMENT } from './dist/api/types/enums/environment.enum';
require('module-alias/register');
const { knexConfig } = require("./dist/config/environment.config");
module.exports = knexConfig
