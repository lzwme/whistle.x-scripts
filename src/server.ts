import { color } from '@lzwme/fe-utils';
import { toQueryString } from '@lzwme/fe-utils/cjs/common/url';
import { logger } from './lib/helper';
import { ruleHandler } from './lib/ruleHandler';
import { rulesManage } from './lib/rulesManage';
import * as util from './util/util';

export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
  logger.info(color.green(options.name), '插件已加载');

  // handle http request
  server.on('request', async (req: Whistle.PluginServerRequest, res: Whistle.PluginServerResponse) => {
    try {
      if (util.isRemote(req)) return req.passThrough();

      const { method, headers, fullUrl: url } = req;
      logger.trace('[request]', color.cyan(method), color.gray(url), headers);

      const reqHeaderRules = rulesManage.rules['req-header'];

      if (reqHeaderRules?.size > 0) {
        for (const rule of reqHeaderRules.values()) {
          try {
            const r = await ruleHandler({ req, rule, res });
            if (r.body) return res.end(util.toBuffer(r.body));
          } catch (e) {
            logger.error('[ruleHandler]err', rule.ruleId, e);
          }
        }
      }

      let reqBody: Buffer | Record<string, any>;
      req.passThrough(
        async (body, next, ctx) => {
          reqBody = body;

          const mockRules = rulesManage.rules['req-body'];
          if (mockRules?.size > 0) {
            reqBody = util.jsonParse(body) || body;

            for (const rule of mockRules.values()) {
              try {
                const r = await ruleHandler({ req: ctx, rule, res, reqBody });
                if (r.body) return res.end(util.toBuffer(r.body));
                if (r.reqBody) {
                  if (typeof r.reqBody === 'object' && !Buffer.isBuffer(r.reqBody)) {
                    r.reqBody = util.isJSON(headers, true) ? JSON.stringify(r.reqBody) : toQueryString(r.reqBody);
                    // req.writeHead(0, { 'content-length': Buffer.from(r.reqBody).byteLength });
                  }
                  body = util.toBuffer(r.reqBody);
                }
              } catch (e) {
                logger.error('[ruleHandler]err', rule.ruleId, e);
              }
            }
          }

          next({ body });
        },
        async (buf, next, ctx) => {
          const body = buf;
          const resBodyRules = rulesManage.rules['res-body'];

          if (resBodyRules?.size > 0) {
            let ubody = await new Promise(rs => util.unzipBody(ctx.headers, body, (_e, d) => rs(d)));
            if (ubody && util.isText(ctx.headers)) ubody = String(ubody || '');
            const resBody = util.isJSON(ctx.headers) || util.isJSON(headers) ? util.jsonParse(ubody) || ubody : ubody;

            for (const rule of resBodyRules.values()) {
              try {
                const r = await ruleHandler({ rule, req, res: ctx, resBody, reqBody });
                if (r.body) return next({ body: Buffer.isBuffer(r.body) || typeof r.body === 'string' ? r.body : JSON.stringify(r.body) });
              } catch (e) {
                logger.error('[ruleHandler]err', rule.ruleId, e);
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
