/*
 * @Author: renxia
 * @Date: 2024-01-22 14:00:13
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-29 22:07:31
 * @Description:
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Watcher } from './lib/watch';
import { md5 } from '@lzwme/fe-utils';
import { logger } from './lib/helper';

const rulesMap = new Map<string, string>();

function formatToWhistleRules(content: string, type: string = 'w2') {
  if (!content || typeof content !== 'string') return '';
  if (type === 'w2') return content;

  // const result: string[] = [];
  // content.trim().split('\n').forEach(line => {
  //   line = line.trim();
  //   if (line === '') return;
  //   // todo:

  //   result.push(line);
  // });
  // return result.join('\n');
  return content;
}

export async function handlerRuleFiles(
  filepath: string | (() => string | Promise<string>),
  contentType?: 'w2' | 'pac',
  fileType?: 'url' | 'file' | 'rules'
) {
  try {
    if (typeof filepath === 'function') filepath = await filepath();
    if (!filepath || typeof filepath !== 'string') return;

    filepath = filepath.trim();

    let content = '';

    if (!fileType) fileType = filepath.includes(' ') ? 'rules' : filepath.startsWith('http') ? 'url' : 'file';

    // 为 rule content
    if (fileType === 'rules') {
      rulesMap.set(md5(filepath), formatToWhistleRules(filepath, contentType || 'w2'));
      return;
    }

    if (fileType === 'file') filepath = resolve(filepath);
    if (rulesMap.has(filepath)) return;

    if (fileType === 'url') {
      if (filepath.endsWith('.pac')) {
        rulesMap.set(filepath, `* pac://${filepath}`);
        return;
      }

      rulesMap.set(filepath, '');
      content = await fetch(filepath).then(d => d.text());
      rulesMap.set(filepath, formatToWhistleRules(content, contentType));
    } else {
      if (!existsSync(filepath)) {
        logger.warn('whistle rule 规则文件不存在', filepath);
        return;
      }

      Watcher.add(
        filepath,
        (type, f) => {
          if (type === 'del') rulesMap.delete(f);
          else {
            content = readFileSync(f, 'utf8');
            rulesMap.set(f, formatToWhistleRules(readFileSync(f, 'utf8'), contentType));
          }
        },
        true,
        ['txt', 'conf', 'yaml', 'json']
      );
    }
  } catch (error) {
    logger.error('whistle rule 规则文件解析失败', filepath, error);
  }
}

export function rulesServer(server: Whistle.PluginServer, options: Whistle.PluginOptions) {
  server.on('request', async (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
    const localRulePath = req.originalReq.ruleValue;
    if (localRulePath) await handlerRuleFiles(localRulePath);

    const rules = Array.from(rulesMap.values()).join('\n');
    res.end(rules);
  });
}
