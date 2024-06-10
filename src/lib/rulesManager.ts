import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { clearRequireCache, color } from '@lzwme/fe-utils';
import { logger } from './helper';
import type { RuleRunOnType, RuleItem, W2XScriptsConfig } from '../../typings';
import { getConfig } from './getConfig';
import { Watcher, WatcherOnChange } from './watch';

const { green, cyan, magenta, magentaBright, greenBright } = color;
const RulesCache: Partial<Record<RuleRunOnType | 'all', Map<string, RuleItem>>> = { all: new Map() };
const RuleOnList = ['req-header', 'req-body', 'res-body'] as const;

function ruleFormat(rule: RuleItem) {
  if (!rule || (!rule.ruleId && !rule.url)) return false;

  if (!rule.handler) {
    logger.error(`[${rule.on}]未设置处理方法，忽略该规则:`, rule._source || rule.ruleId || rule);
    return false;
  }

  if (rule.method == null) rule.method = 'post';

  if (!rule.ruleId) {
    rule.ruleId = `${rule.desc || rule.url}_${rule.method || ''}`;
    logger.log(`未设置 ruleId 参数，采用 desc/url + method。[${rule.ruleId}]`);
  }

  if (!rule.on || !RuleOnList.includes(rule.on)) {
    const ruleOn = rule.getCacheUid ? 'res-body' : 'req-header';
    if (rule.on) logger.warn(`[${rule.on}] 参数错误，自动设置为[${ruleOn}]！只能取值为: ${RuleOnList.join(', ')}`, rule.ruleId);
    rule.on = ruleOn;
  }

  if (!rule.desc) rule.desc = `${rule.ruleId}_${rule.url || rule.method}`;

  if (rule.mitm) {
    if (!Array.isArray(rule.mitm)) rule.mitm = [rule.mitm];
    rule.mitm = rule.mitm.filter(d => d && (typeof d === 'string' || d instanceof RegExp));
  }

  return rule;
}

function classifyRules(rules: RuleItem[], config: W2XScriptsConfig, isInit = false) {
  if (isInit) Object.values(RulesCache).forEach(cache => cache.clear());

  const { ruleInclude = [], ruleExclude = [] } = config;
  rules.forEach((rule, idx) => {
    if (!rule || !ruleFormat(rule)) return;
    RulesCache.all.set(rule.ruleId, rule);

    let disabled = rule.disabled;
    if (disabled == null) disabled = ruleExclude.includes(rule.ruleId) || (ruleInclude.length && !ruleInclude.includes(rule.ruleId));

    if (disabled) {
      logger.log(`规则已${rule.disabled ? color.red('禁用') : color.gray('过滤')}: [${rule.on}][${rule.ruleId}][${rule.desc}]`);
      if (RulesCache[rule.on]?.has(rule.ruleId)) RulesCache[rule.on]!.delete(rule.ruleId);
      return;
    }

    if (!RulesCache[rule.on]) RulesCache[rule.on] = new Map();

    if (isInit && RulesCache[rule.on]!.has(rule.ruleId)) {
      const preRule = RulesCache[rule.on]!.get(rule.ruleId);
      logger.warn(`[${idx}]存在ruleId重复的规则:[${magenta(rule.ruleId)}]\n - ${cyan(preRule._source)}\n - ${cyan(rule._source)}`);
    }

    RulesCache[rule.on]!.set(rule.ruleId, rule);
    logger.info(`Load Rule:[${rule.on}][${cyan(rule.ruleId)}]`, green(rule.desc));
  });

  const s = [...Object.entries(RulesCache)].filter(d => d[0] !== 'all').map(d => `${cyan(d[0])}: ${green(d[1].size)}`);
  logger.info(`脚本规则总数：${green(RulesCache.all.size)}  本次加载：${magentaBright(rules.length)}  已启用：[${s.join(', ')}]`);
}

function loadRules(filepaths: string[] = [], isInit = false) {
  if (!Array.isArray(filepaths)) filepaths = [filepaths];

  const filesSet = new Set<string>();
  const findRuleFiles = (filepath: string) => {
    if (!filepath || typeof filepath !== 'string' || !existsSync(filepath)) return;

    filepath = resolve(process.cwd(), filepath);

    if (statSync(filepath).isDirectory()) {
      readdirSync(filepath)
        .filter(d => /rules|src|vip|active|(\.c?js)$/.test(d))
        .forEach(d => findRuleFiles(resolve(filepath, d)));
    } else if (/\.c?js/.test(filepath)) {
      filesSet.add(filepath);
      Watcher.add(filepath, onRuleFileChange, false);
    }
  };

  // 合入当前目录下名称包含 `x-scripts-rule` 的文件或目录
  new Set(filepaths.filter(Boolean).map(d => resolve(d))).forEach(d => {
    findRuleFiles(d);
    Watcher.add(d, onRuleFileChange, false);
  });

  const rules = new Map<string, RuleItem>();
  for (let filepath of filesSet) {
    try {
      clearRequireCache(filepath);
      const rule = require(filepath);
      if (!rule) continue;
      if (Array.isArray(rule))
        rule.forEach((d: RuleItem) => {
          if (ruleFormat(d) && !rules.has(d.ruleId)) {
            if (!d._source) d._source = filepath;
            rules.set(d.ruleId, d);
          }
        });
      else if (typeof rule === 'object' && ruleFormat(rule) && !rules.has(rule.ruleId)) {
        if (!rule._source) rule._source = filepath;
        rules.set(rule.ruleId, rule);
      }
    } catch (e) {
      console.error(e);
      logger.warn('从文件加载规则失败:', color.yellow(filepath), color.red(e.message));
    }
  }

  if (isInit && rules.size) {
    logger.debug(
      `加载的规则：\n - ${[...rules].map(([ruleId, d]) => `[${green(ruleId)}]${d.desc || d.url}`).join('\n - ')}`,
      `\n加载的文件：\n - ${[...filesSet].join('\n - ')}`
    );
    logger.info(`从 ${cyan(filesSet.size)} 个文件中发现了 ${greenBright(rules.size)} 个自定义规则`);
  }

  return rules;
}

function changeRuleStatus(rule: RuleItem, status: boolean, config = getConfig()) {
  if (typeof rule === 'string') rule = RulesCache.all.get(rule);
  if (!rule?.ruleId || !RulesCache.all.has(rule.ruleId)) return false;

  rule.disabled = status;
  classifyRules([rule], config, false);
  return true;
}

function removeRule(ruleId?: string[], filepath?: string[]) {
  let count = 0;
  if (!ruleId && !filepath) return count;
  const ruleSet = new Set(ruleId ? ruleId : []);
  const fileSet = new Set(filepath ? filepath : []);

  for (const [type, item] of Object.entries(rulesManager.rules)) {
    for (const [ruleId, rule] of item) {
      if (ruleSet.has(ruleId) || fileSet.has(rule._source)) {
        item.delete(ruleId);
        if (type === 'all') count++;
      }
    }
  }

  return count;
}

const onRuleFileChange: WatcherOnChange = (type, filepath) => {
  if (type === 'del') {
    const count = removeRule(void 0, [filepath]);
    logger.info(`文件已删除: ${color.yellow(filepath)}，删除了 ${color.cyan(count)} 条规则。`);
  } else {
    const rules = loadRules([filepath], false);
    if (rules.size) classifyRules([...rules.values()], getConfig(), false);
    logger.info(`文件${type === 'add' ? '新增' : '修改'}: ${color.yellow(filepath)}，更新了条 ${color.cyan(rules.size)} 规则`);
  }
};

export const rulesManager = {
  rules: RulesCache,
  ruleFormat,
  classifyRules,
  loadRules,
  changeRuleStatus,
  removeRule,
  // onRuleFileChange,
};
