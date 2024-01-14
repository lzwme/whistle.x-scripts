import { color } from '@lzwme/fe-utils';
import { logger } from './lib/helper';
import { mockRuleHandler, modifyRuleHandler, saveCookieRuleHandler } from './lib/ruleHandler';
import { rulesManage } from './lib/rulesManage';
import * as util from './util/util';

export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
  logger.info(color.green(require('../package.json').name), '插件已加载');

  // handle http request
  server.on('request', async (req: Whistle.PluginServerRequest, res: Whistle.PluginServerResponse) => {
    try {
      if (util.isRemote(req)) return req.passThrough();

      const { method, headers, fullUrl: url } = req;
      logger.trace('[request]', color.cyan(method), color.gray(url), headers);

      // saveCookie
      rulesManage.rules.saveCookie?.forEach(async rule => {
        try {
          const { errmsg, envConfig } = await saveCookieRuleHandler({ rule, req, res });
          if (!String(errmsg).includes('[ruleMatcher]')) {
            logger.debug(`[saveCookie][${color.green(rule.desc)}]`, envConfig ? color.green('通过') : color.gray(`忽略：${errmsg}`));
          }
        } catch (e) {
          logger.error('[saveCookieRuleHandler]err', rule.ruleId, e);
        }
      });

      let reqBody: Buffer | Record<string, any>;
      req.passThrough(
        async (body, next, ctx) => {
          reqBody = body;
          const mockRules = rulesManage.rules.mock;

          if (mockRules?.size > 0) {
            const rBody = util.jsonParse(body) || body;
            reqBody = rBody;

            for (const rule of mockRules.values()) {
              try {
                const r = await mockRuleHandler({ req: ctx, rule, res, reqBody: rBody });
                if (r.body) return res.end(util.toBuffer(r.body));
              } catch(e) {
                logger.error('[mockRuleHandler]err', rule.ruleId, e);
              }
            }
          }

          next({ body });
        },
        async (buf, next, ctx) => {
          const body = buf;
          const modifyRules = rulesManage.rules.modify;

          if (modifyRules?.size > 0) {
            let ubody = await new Promise(rs => util.unzipBody(ctx.headers, body, (_e, d) => rs(d)));
            if (ubody && util.isText(ctx.headers)) ubody = String(ubody || '');
            const resBody = util.isJSON(ctx.headers) || util.isJSON(headers) ? util.jsonParse(ubody) || ubody : ubody;

            for (const rule of modifyRules.values()) {
              try {
                const r = await modifyRuleHandler({ rule, req, res: ctx, resBody, reqBody });
                if (r.body) return next({ body: Buffer.isBuffer(r.body) || typeof r.body === 'string' ? r.body : JSON.stringify(r.body) });
              } catch (e) {
                logger.error('[modifyRuleHandler]err', rule.ruleId, e);
              }
            }
          }

          next({ body });
        }
      );
    } catch (error) {
      logger.log(error.toString());
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(error.toString());
    }
  });

  // // handle websocket request
  // server.on('upgrade', (req: Whistle.PluginServerRequest, socket: Whistle.PluginServerSocket) => {
  //   // do something
  //   req.passThrough();
  // });
  // // handle tunnel request
  // server.on('connect', (req: Whistle.PluginServerRequest, socket: Whistle.PluginServerSocket) => {
  //   // do something
  //   req.passThrough();
  // });
  // server.on('error', err => logger.error(err));
};
