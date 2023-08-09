"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const todo_model_js_1 = require("../models/todo.model.js");
const dayjs_1 = __importDefault(require("dayjs"));
class TodoController {
    static async get(req, reply) {
        const { order, direction, offset, limit, q, filters, done } = req.query;
        const query = todo_model_js_1.Todo.query()
            .withGraphJoined('[creator(identifier), editor(identifier)]')
            .where({
            user_id: req.session.user.user_id,
        })
            .page(offset ? offset : 0, parseInt(limit) === 0 || !limit ? 10 : limit);
        if (done) {
            query.where('todos.done', done === 'true');
        }
        if (filters) {
            try {
                const filtering = JSON.parse(filters);
                if (Array.isArray(filtering)) {
                    filtering.forEach((v) => {
                        if ('date' in v && typeof v['date'] === 'object') {
                            query.whereBetween('date', [v.date.from, v.date.to]);
                        }
                        else {
                            query.where(v);
                        }
                    });
                }
            }
            catch (e) {
                req.log.error(e);
            }
        }
        if (order) {
            if (Array.isArray(order)) {
                order.forEach((field, index) => query.orderBy(field, direction[index]));
            }
            else {
                query.orderBy(order, direction);
            }
        }
        if (q) {
            if (q.trim() !== '') {
                query.where((builder) => {
                    builder
                        .orWhere('todos.name', 'like', `%${q}%`)
                        .orWhere('todos.note', 'like', `%${q}%`);
                });
            }
        }
        const result = await query.orderBy('id');
        return { ...result };
    }
    static async post(req, reply) {
        const body = req.body;
        const insert = {
            date: body.date,
            name: body.name,
            note: body.note,
            done: body.done,
            url: body.url,
        };
        const repeat = body.repeat ? body.repeat : 0;
        const interval = body.interval ? body.interval : 0;
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            const result = [];
            const res = await todo_model_js_1.Todo.query(trx).insert({
                ...insert,
                user_id: req.session.user.user_id,
                bee_id: req.session.user.bee_id,
            });
            result.push(res.id);
            if (repeat > 0) {
                for (let i = 0; i < repeat; i++) {
                    insert.date = (0, dayjs_1.default)(insert.date)
                        .add(interval, 'days')
                        .format('YYYY-MM-DD');
                    const res = await todo_model_js_1.Todo.query(trx).insert({
                        ...insert,
                        user_id: req.session.user.user_id,
                        bee_id: req.session.user.bee_id,
                    });
                    result.push(res.id);
                }
            }
            return result;
        });
        return result;
    }
    static async patch(req, reply) {
        const body = req.body;
        const ids = body.ids;
        const insert = { ...body.data };
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            return await todo_model_js_1.Todo.query(trx)
                .patch({ ...insert, bee_id: req.session.user.bee_id })
                .findByIds(ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async batchGet(req, reply) {
        const body = req.body;
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            const res = await todo_model_js_1.Todo.query(trx)
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
            return res;
        });
        return result;
    }
    static async batchDelete(req, reply) {
        const body = req.body;
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            return todo_model_js_1.Todo.query(trx)
                .delete()
                .whereIn('id', body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async updateStatus(req, reply) {
        const body = req.body;
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            return todo_model_js_1.Todo.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                done: body.status,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
    static async updateDate(req, reply) {
        const body = req.body;
        const result = await todo_model_js_1.Todo.transaction(async (trx) => {
            return todo_model_js_1.Todo.query(trx)
                .patch({
                edit_id: req.session.user.bee_id,
                date: body.start,
            })
                .findByIds(body.ids)
                .where('user_id', req.session.user.user_id);
        });
        return result;
    }
}
exports.default = TodoController;
