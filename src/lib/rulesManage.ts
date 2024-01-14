import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { color } from '@lzwme/fe-utils';
import { logger } from './helper';
import type { RuleType, RuleItem } from '../../typings';

const { green, cyan, magenta, magentaBright, greenBright } = color;
const RulesCache: Partial<Record<RuleType | 'all', Map<string, RuleItem>>> = { all: new Map() };

function ruleFormat(rule: RuleItem) {
  if (!rule || (!rule.ruleId && !rule.url)) return false;

  if (!rule.ruleId) {
    rule.ruleId = `${rule.desc || rule.url}_${rule.method || ''}`;
    logger.log(`未设置 ruleId 参数，采用 desc/url + method。[${rule.ruleId}]`);
  }

  if (!rule.type) {
    if (rule.mockHandler) rule.type = 'mock';
    else if (rule.modifyHandler) rule.type = 'modify';
    else rule.type = 'saveCookie';
  }

  if (rule.handler) {
    if (rule.type === 'mock' && !rule.mockHandler) rule.mockHandler = rule.handler;
    else if (rule.type === 'modify' && !rule.modifyHandler) rule.modifyHandler = rule.handler;
    else if (rule.type === 'saveCookie' && !rule.saveCookieHandler) rule.saveCookieHandler = rule.handler;
    delete rule.handler;
  }

  if (
    (rule.type === 'saveCookie' && !rule.saveCookieHandler) ||
    (rule.type === 'mock' && !rule.mockHandler) ||
    (rule.type === 'modify' && !rule.modifyHandler)
  ) {
    logger.warn(`[${rule.type}]未设置处理方法，忽略该规则:`, rule._source || rule.ruleId || rule);
    return false;
  }

  if (!rule.desc) rule.desc = `${rule.ruleId}_${rule.url || rule.method}`;

  return rule;
}

function classifyRules(rules: RuleItem[], isInit = false) {
  if (isInit) Object.values(RulesCache).forEach(cache => cache.clear());

  rules.forEach((rule, idx) => {
    if (!rule || !ruleFormat(rule)) return;
    RulesCache.all.set(rule.ruleId, rule);

    if (rule.disabled) {
      logger.log(`规则已禁用: [${rule.type}][${rule.ruleId}][${rule.desc}]`);
      if (RulesCache[rule.type]?.has(rule.ruleId)) RulesCache[rule.type]!.delete(rule.ruleId);
      return;
    }

    if (!RulesCache[rule.type]) RulesCache[rule.type] = new Map();

    if (isInit && RulesCache[rule.type]!.has(rule.ruleId)) {
      const preRule = RulesCache[rule.type]!.get(rule.ruleId);
      logger.warn(`[${idx}]存在ruleId重复的规则:[${magenta(rule.ruleId)}]\n - ${cyan(preRule._source)}\n - ${cyan(rule._source)}`);
    }

    RulesCache[rule.type]!.set(rule.ruleId, rule);
    logger.log(`Load Rule:[${rule.type}][${cyan(rule.ruleId)}]`, green(rule.desc));
  });

  const s = [...Object.entries(RulesCache)].filter(d => d[0] !== 'all').map(d => `${cyan(d[0])}: ${green(d[1].size)}`);
  logger.info(`脚本规则总数：${green(RulesCache.all.size)}  本次加载：${magentaBright(rules.length)}  已启用：[${s.join(', ')}]`);
}

function loadRules(filepaths: string[] = [], isInit = false) {
  if (!Array.isArray(filepaths)) filepaths = [filepaths];

  const filesSet = new Set<string>();
  const findRuleFiles = (filepath: string) => {
    if (!filepath || typeof filepath !== 'string' || !existsSync(filepath)) return;

    if (statSync(filepath).isDirectory()) {
      readdirSync(filepath)
        .filter(d => /(rules)|(\.c?js)/.test(d))
        .forEach(d => findRuleFiles(resolve(filepath, d)));
    } else if (/\.c?js/.test(filepath)) {
      filesSet.add(resolve(process.cwd(), filepath));
    }
  };

  // 合入当前目录下名称包含 `x-scripts-rule` 的文件或目录
  new Set(
    readdirSync(process.cwd())
      .filter(d => d.includes('x-scripts-rule'))
      .concat(filepaths)
      .filter(Boolean)
      .map(d => resolve(d))
  ).forEach(d => findRuleFiles(d));

  const rules = new Set<RuleItem>();
  for (let filepath of filesSet) {
    try {
      const rule = require(filepath);
      if (!rule) continue;
      if (Array.isArray(rule))
        rule.forEach((d: RuleItem) => {
          if (!rules.has(d) && ruleFormat(d)) {
            if (!d._source) d._source = filepath;
            rules.add(d);
          }
        });
      else if (typeof rule === 'object' && !rules.has(rule) && ruleFormat(rule)) {
        if (!rule._source) rule._source = filepath;
        rules.add(rule);
      }
    } catch (e) {
      logger.log('尝试从文件加载规则失败：', filepath, e.message);
    }
  }

  if (isInit && rules.size) {
    logger.debug(
      `加载的规则：\n - ${[...rules].map(d => `[${green(d.ruleId)}]${d.desc || d.url}`).join('\n - ')}`,
      `\n加载的文件：\n - ${[...filesSet].join('\n - ')}`
    );
    logger.info(`从 ${cyan(filesSet.size)} 个文件中发现了 ${greenBright(rules.size)} 个自定义规则`);
  }

  return rules;
}

export const rulesManage = {
  rules: RulesCache,
  ruleFormat,
  classifyRules,
  loadRules,
};
