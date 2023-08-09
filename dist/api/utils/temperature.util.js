"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemperature = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const environment_config_js_1 = require("../../config/environment.config.js");
const logger_service_js_1 = require("../../services/logger.service.js");
const getTemperature = async (latitude, longitude) => {
    // Api Key is given by meteoblue, we pay for it yearly, with limited amount of usage. (60,00 €/ 30 Mio Fetches)
    // https://www.meteoblue.com/en/weather-api
    const url = `https://my.meteoblue.com/packages/current?apikey=${environment_config_js_1.meteoblueKey}&lat=${latitude}&lon=${longitude}&format=json`;
    try {
        const response = await fetch(url);
        return response.json();
    }
    catch (error) {
        logger_service_js_1.Logger.getInstance().log('error', 'Meteoblue error', {
            label: 'Meteoblue',
            error: error,
        });
        throw http_errors_1.default.ServiceUnavailable('Meteoblue error');
    }
};
exports.getTemperature = getTemperature;
