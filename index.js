/*
 * @Author: renxia
 * @Date: 2024-01-10 16:58:26
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-29 20:06:35
 * @Description: 一个 whistle 插件， 用于自动抓取 cookie 并保存
 */

exports.server = require('./dist/server.js').default;
exports.rulesServer = require('./dist/rulesServer.js').rulesServer;
// exports.reqRead = require('./dist/reqRead').default;
// exports.reqWrite = require('./dist/reqWrite').default;
// exports.resRead = require('./dist/resRead').default;
// exports.resWrite = require('./dist/resWrite').default;
