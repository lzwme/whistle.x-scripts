/*
 * @Author: renxia
 * @Date: 2024-01-22 14:00:13
 * @LastEditors: renxia
 * @LastEditTime: 2024-05-08 13:59:33
 * @Description:
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { color } from '@lzwme/fe-utils';
import { Watcher } from './watch';
import { logger } from './helper';
import type { WhistleRuleItem } from '../../typings';
import { isMatch } from 'micromatch';

type W2RuleMapItem = { rules: string[]; values?: Record<string, any>; config?: WhistleRuleItem };

const rulesMap = new Map<WhistleRuleItem | string, W2RuleMapItem>();

function formatToWhistleRules(content: string, config?: WhistleRuleItem) {
  const data: W2RuleMapItem = { rules: [], values: {}, config };
  if (!content?.trim()) return data;

  try {
    const cfg = JSON.parse(content.trim());
    // todo: 支持远程加载完整的配置
    if (Array.isArray(cfg) && Array.isArray(cfg[0].rules)) {
      handlerW2RuleFiles(cfg);
    } else {
      if (Array.isArray(cfg.rules)) data.rules.push(...cfg.rules);
      if (cfg.values && typeof cfg.values === 'object') Object.assign(data.values, cfg.values);
    }
  } catch {
    data.rules.push(content.trim());
  }

  return data;
}

function getW2RuleKey(ruleConfig: WhistleRuleItem) {
  if (!ruleConfig) return '';
  if (ruleConfig.path) ruleConfig.path = resolve(ruleConfig.path);
  if (!ruleConfig.url?.startsWith('http')) ruleConfig.url = '';

  return ruleConfig.path || ruleConfig.url || ruleConfig;
}

export async function handlerW2RuleFiles(ruleConfig: WhistleRuleItem): Promise<boolean> {
  if (typeof ruleConfig === 'string') ruleConfig = (ruleConfig as string).startsWith('http') ? { url: ruleConfig } : { path: ruleConfig };

  const ruleKey = getW2RuleKey(ruleConfig);

  try {
    if (!ruleKey || rulesMap.has(ruleKey)) return false;
    // if (typeof ruleConfig === 'function') return rulesMap.set(ruleKey, await ruleConfig());

    rulesMap.set(ruleKey, { rules: [], values: {}, config: ruleConfig });
    const data = rulesMap.get(ruleKey);

    if (ruleConfig.rules) data.rules.push(...ruleConfig.rules);
    if (ruleConfig.values) data.values = { ...ruleConfig.values };

    if (ruleConfig.url) {
      if (ruleConfig.type === 'pac' || ruleConfig.url.endsWith('.pac.js')) {
        data.rules.push(`* pac://${ruleConfig.url}`);
      } else {
        const content = await fetch(ruleConfig.url).then(d => d.text());

        const d = formatToWhistleRules(content);
        if (d.rules.length) data.rules.push(...d.rules);
        if (d.rules) Object.assign(data.values, d.values);
      }
    }

    if (ruleConfig.path) {
      if (existsSync(ruleConfig.path)) {
        Watcher.remove(ruleConfig.path, false);
        Watcher.add(
          ruleConfig.path,
          (type, f) => {
            if (type === 'del' && rulesMap.has(f)) rulesMap.delete(f);
            else {
              logger.log(`[${type === 'add' ? '新增' : '更新'}]W2规则文件:`, color.cyan(f));
              const d = formatToWhistleRules(readFileSync(f, 'utf8'), ruleConfig);
              if (d.rules.length) rulesMap.set(f, d);
            }
          },
          true,
          ['txt', 'conf', 'yaml', 'json']
        );
        logger.debug('加载 w2 规则文件：', color.cyan(ruleConfig.path));
      } else {
        logger.warn('whistle rule 规则文件不存在', color.yellow(ruleConfig.path));
      }
    }

    if (!data.rules.length) rulesMap.delete(ruleKey);
  } catch (error) {
    logger.error('whistle rule 规则解析失败', color.red(ruleKey), error);
  }
}

function removeW2Rules(whistleRules: WhistleRuleItem[]) {
  whistleRules.forEach(d => {
    const ruleKey = getW2RuleKey(d);
    if (ruleKey) {
      rulesMap.delete(ruleKey);
      if (d.path) Watcher.remove(d.path, false);
    }
  });
}

export function loadW2Rules(whistleRules: WhistleRuleItem[], action: 'clear' | 'purge' = 'purge') {
  if (action === 'clear') rulesMap.clear();
  else if (action === 'purge') removeW2Rules([...rulesMap.values()].filter(d => !whistleRules.includes(d.config)));

  if (whistleRules.length) {
    whistleRules.forEach(d => handlerW2RuleFiles(d));
    logger.info('w2 规则已加载：', rulesMap.size);
  }
}

const cache = {
  w2Rules: {
    value: {} as Record<string, any>,
    update: 0,
  },
};

export function getW2Rules(req: Whistle.PluginRequest) {
  const now = Date.now();

  // 30s 缓存
  if (now - cache.w2Rules.update > 30_000) {
    const rulesSet = new Set<string>();
    const values = {} as W2RuleMapItem['values'];

    rulesMap.forEach(item => {
      item.rules.forEach(r => rulesSet.add(r));
      Object.assign(values, item.values);
    });

    const rules = [...rulesSet]
      .join('\n')
      .split('\n')
      .map(d => d.trim())
      .filter(d => d && d.startsWith('#') && d.includes(' ') && d.includes('//'));
    cache.w2Rules.value = { rules, values };
  }

  const { rules, values } = cache.w2Rules.value;
  const { fullUrl } = req;

  for (const line of rules) {
    let isMatched = false;
    let url: string | RegExp = line.split(' ')[0];
    if ((url as string).startsWith('^http')) url = new RegExp(url);

    if (url instanceof RegExp) isMatched = url.test(fullUrl);
    else isMatched = fullUrl.includes(url) || isMatch(fullUrl, url);

    // 性能考虑，暂只支持一个规则
    if (isMatched) return { rules: [line], values };
  }

  return;
}
