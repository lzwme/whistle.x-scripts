/*
 * @Author: renxia
 * @Date: 2024-01-22 14:00:13
 * @LastEditors: renxia
 * @LastEditTime: 2024-05-08 14:01:31
 * @Description:
 */
import { handlerW2RuleFiles, getW2Rules } from './lib/w2RulesManage';

export function rulesServer(server: Whistle.PluginServer, options: Whistle.PluginOptions) {
  server.on('request', async (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
    const rulePath = req.originalReq.ruleValue;
    if (rulePath) {
      const isUrl = rulePath.startsWith('http');
      await handlerW2RuleFiles({ path: isUrl ? '' : rulePath, url: isUrl ? rulePath : '' });
    }

    const rules = getW2Rules(req);
    rules ? res.end(rules) : res.end();
  });
}
