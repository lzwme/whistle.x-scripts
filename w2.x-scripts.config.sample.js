const rulesIndex = require.resolve('@lzwme/whistle.x-scripts/x-scripts-rules', { paths: require.main.paths });
const rules = require(rulesIndex);
console.log('内置 rules:', rules.map(rule => rule.ruleId).join(', '));

/** @type {import('@lzwme/whistle.x-scripts').W2CookiesConfig} */
const config = {
  // debug: false,
  // logType: 'info',
  /** 青龙服务地址。用于上传环境变量，若设置为空则不上传 */
  // qlHost: 'http://127.0.0.1:5700',
  /** 青龙服务 token。用于创建或更新 QL 环境变量配置。会自动尝试从 /ql/data/config/auth.json 文件中获取 */
  // qlToken: '',
  /** 写入环境变量信息到本地文件 */
  // envConfFile: 'env-config.sh',
  /** 写入环境变量信息到本地文件的路径。若设置为空则不写入 */
  // cacheFile: 'w2.x-scripts.cache.json',
  /** 数据处理防抖时间间隔。单位为秒，默认为 10 (s) */
  throttleTime: 10,
  /** 指定规则集文件路径或所在目录，尝试从该列表加载自定义的规则集 */
  // ruleDirs: [rulesIndex, './custom-x-scripts-rules'],
  /** 自定义脚本规则 */
  rules: [
    ...rules, // 使用内置规则
  ],
};

module.exports = config;
