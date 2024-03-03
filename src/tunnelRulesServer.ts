import { getConfig } from './lib/getConfig';
import { rulesManage } from './lib/rulesManage';
import { isMatch } from 'micromatch';

function mitmMatch(req: Whistle.PluginRequest) {
  if (rulesManage.rules['res-body'].size === 0) return;

  const host = (req.headers.host || new URL(req.originalReq.fullUrl).host).split(':')[0];
  const resBodyRules = rulesManage.rules['res-body'].values();

  for (const item of resBodyRules) {
    if (item.mitm) {
      const ok = (item.mitm as (string | RegExp)[]).some(d => (d instanceof RegExp ? d.test(host) : isMatch(host, d)));
      if (ok) return host;
    }
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
