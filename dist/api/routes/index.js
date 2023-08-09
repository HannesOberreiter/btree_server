"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_js_1 = __importDefault(require("./v1/auth.route.js"));
const apiary_route_js_1 = __importDefault(require("./v1/apiary.route.js"));
const charge_route_js_1 = __importDefault(require("./v1/charge.route.js"));
const checkup_route_js_1 = __importDefault(require("./v1/checkup.route.js"));
const company_user_route_js_1 = __importDefault(require("./v1/company_user.route.js"));
const user_route_js_1 = __importDefault(require("./v1/user.route.js"));
const company_route_js_1 = __importDefault(require("./v1/company.route.js"));
const dropbox_route_js_1 = __importDefault(require("./v1/dropbox.route.js"));
const external_route_js_1 = __importDefault(require("./v1/external.route.js"));
const scale_route_js_1 = __importDefault(require("./v1/scale.route.js"));
const scale_data_route_js_1 = __importDefault(require("./v1/scale_data.route.js"));
const statistic_route_js_1 = __importDefault(require("./v1/statistic.route.js"));
const hive_route_js_1 = __importDefault(require("./v1/hive.route.js"));
const root_route_js_1 = __importDefault(require("./v1/root.route.js"));
const calendar_route_js_1 = __importDefault(require("./v1/calendar.route.js"));
const feed_route_js_1 = __importDefault(require("./v1/feed.route.js"));
const treatment_route_js_1 = __importDefault(require("./v1/treatment.route.js"));
const harvest_route_js_1 = __importDefault(require("./v1/harvest.route.js"));
const queen_route_js_1 = __importDefault(require("./v1/queen.route.js"));
const movedate_route_js_1 = __importDefault(require("./v1/movedate.route.js"));
const option_route_js_1 = __importDefault(require("./v1/option.route.js"));
const rearing_route_js_1 = __importDefault(require("./v1/rearing.route.js"));
const rearing_detail_route_js_1 = __importDefault(require("./v1/rearing_detail.route.js"));
const rearing_type_route_js_1 = __importDefault(require("./v1/rearing_type.route.js"));
const rearing_step_route_js_1 = __importDefault(require("./v1/rearing_step.route.js"));
const field_setting_route_js_1 = __importDefault(require("./v1/field_setting.route.js"));
const service_route_js_1 = __importDefault(require("./v1/service.route.js"));
const todo_route_js_1 = __importDefault(require("./v1/todo.route.js"));
function routes(app, _options, done) {
    app.register(root_route_js_1.default, {
        prefix: '/v1/',
    });
    app.register(auth_route_js_1.default, {
        prefix: '/v1/auth',
    });
    app.register(apiary_route_js_1.default, {
        prefix: '/v1/apiary',
    });
    app.register(calendar_route_js_1.default, {
        prefix: '/v1/calendar',
    });
    app.register(charge_route_js_1.default, {
        prefix: '/v1/charge',
    });
    app.register(checkup_route_js_1.default, {
        prefix: '/v1/checkup',
    });
    app.register(company_user_route_js_1.default, {
        prefix: '/v1/company_user',
    });
    app.register(user_route_js_1.default, {
        prefix: '/v1/user',
    });
    app.register(company_route_js_1.default, {
        prefix: '/v1/company',
    });
    app.register(dropbox_route_js_1.default, {
        prefix: '/v1/dropbox',
    });
    app.register(external_route_js_1.default, {
        prefix: '/v1/external',
    });
    app.register(scale_route_js_1.default, {
        prefix: '/v1/scale',
    });
    app.register(scale_data_route_js_1.default, {
        prefix: '/v1/scale_data',
    });
    app.register(feed_route_js_1.default, {
        prefix: '/v1/feed',
    });
    app.register(field_setting_route_js_1.default, {
        prefix: '/v1/fieldsetting',
    });
    app.register(field_setting_route_js_1.default, {
        prefix: '/v1/field_setting',
    });
    app.register(harvest_route_js_1.default, {
        prefix: '/v1/harvest',
    });
    app.register(hive_route_js_1.default, {
        prefix: '/v1/hive',
    });
    app.register(queen_route_js_1.default, {
        prefix: '/v1/queen',
    });
    app.register(movedate_route_js_1.default, {
        prefix: '/v1/movedate',
    });
    app.register(option_route_js_1.default, {
        prefix: '/v1/option',
    });
    app.register(rearing_route_js_1.default, {
        prefix: '/v1/rearing',
    });
    app.register(rearing_detail_route_js_1.default, {
        prefix: '/v1/rearing_detail',
    });
    app.register(rearing_type_route_js_1.default, {
        prefix: '/v1/rearing_type',
    });
    app.register(rearing_step_route_js_1.default, {
        prefix: '/v1/rearing_step',
    });
    app.register(service_route_js_1.default, {
        prefix: '/v1/service',
    });
    app.register(todo_route_js_1.default, {
        prefix: '/v1/todo',
    });
    app.register(treatment_route_js_1.default, {
        prefix: '/v1/treatment',
    });
    app.register(statistic_route_js_1.default, {
        prefix: '/v1/statistic',
    });
    done();
}
exports.default = routes;
