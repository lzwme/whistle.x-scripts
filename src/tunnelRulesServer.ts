import { isMatch } from 'micromatch';
import { getConfig } from './lib/getConfig';
import { ruleMatcher } from './lib/ruleHandler';
import { rulesManager } from './lib/rulesManager';

function mitmMatch(req: Whistle.PluginRequest) {
  if (rulesManager.rules['res-body'].size === 0) return;

  const host = (req.headers.host || new URL(req.originalReq.fullUrl).host).split(':')[0];
  const resBodyRules = rulesManager.rules['res-body'].values();

  for (const rule of resBodyRules) {
    if (rule.mitm) {
      const ok = (rule.mitm as (string | RegExp)[]).some(d => (d instanceof RegExp ? d.test(host) : isMatch(host, d)));
      if (ok) return host;
    }

    const msg = ruleMatcher({ rule, req: req as unknown as Whistle.PluginServerRequest, res: null });
    if (!msg) return host;
  }
}

export function tunnelRulesServer(server: Whistle.PluginServer, _options: Whistle.PluginOptions) {
  server.on('request', (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
    const { isSNI, enableCapture } = req.originalReq;
    if (enableCapture || !isSNI || getConfig().enableMITM === false) return res.end();

    const host = mitmMatch(req);
    host ? res.end(`${host} enable://intercept`) : res.end();
  });
}
