const rulesIndex = require.resolve('@lzwme/whistle.scte/rules', { paths: require.main.paths });
const rules = require(rulesIndex);
// console.log('内置 rules:', Object.keys(rules));

/** @type {import('@lzwme/whistle.scte').W2CookiesConfig} */
const config = {
  /** 青龙服务地址 */
  qlHost: 'http://127.0.0.1:5700',
  /** 青龙服务 token。用于更新或修改 环境变量 */
  qlToken: '', // 可以从 /ql/data/config/auth.json 文件中获取 auth 字段,
  /** 写入环境变量信息到本地文件 */
  envConfFile: 'env-config.sh',
  /** 缓存数据保存路径 */
  cacheFile: 'w2.scte.json',
  /** 数据处理防抖时间间隔。单位为秒，默认为 10 (s) */
  throttleTime: 10,
  /** 规则定义 */
  rules: [
    {
      disabled: false,
      /** 保存缓存数据ID，应唯一 */
      cacheId: 'JD_COOKIE',
      desc: '京东 cookie 自动抓取并同步至青龙环境变量',
      /** url 匹配规则 */
      url: '.jd.com',
      /** 请求方法匹配 */
      method: '*',
      toQL: true,
      toEnvFile: true,
      mergeCache: false,
      // getUserUid: (headers, url, cookieObj, req) => cookieObj.pt_pin,
      /** 获取当前用户唯一性的 uid */
      getUserUid: (headers, url, cookieObj, req) => {
        // console.log('getUserUid:', url, cookieObj);
        if (cookieObj.wskey && !cookieObj.pin) return;
        // if (cookieObj.wskey) console.log('wskey', cookieObj);

        return { uid: cookieObj.pt_pin || cookieObj.pin, data: cookieObj };
      },
      /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
      handler: (allCacheData, headers, url, cookieObj, req) => {
        if (!cookieObj.pt_pin && !cookieObj.wskey) return;

        // 生成环境变量配置
        const envConfig = [
          {
            name: 'JD_COOKIE',
            // value: allCacheData.filter(d => d.data.pt_pin).map(d => d.headers.cookie).join('&'),
            value: allCacheData
              .filter(d => d.data.pt_pin)
              .map(d => `pt_key=${d.data.pt_key};pt_pin=${d.data.pt_pin};`)
              .join('&'),
            desc: '京东 cookie',
          },
        ];

        if (cookieObj.pin && cookieObj.wskey) {
          envConfig.push({
            name: 'JD_WSCK',
            value: allCacheData
              .filter(d => d.data.wskey)
              .map(d => `pin=${d.data.pin};wskey=${d.data.wskey};`)
              .join('&'),
            desc: '京东 cookie',
          });
        }

        return envConfig;
      },
      /** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
      updateEnvValue(envConfig, oldValue) {
        const oldValues = oldValue.includes('&') ? oldValue.split('&') : oldValue.split('\n');

        for (const cookie of oldValues) {
          const pt_pin = cookie.match(/pin=(\w+)/)?.[0];
          if (pt_pin && !envConfig.value.includes(pt_pin)) envConfig.value += `&${cookie}`;
        }

        return envConfig.value;
      },
    },
    {
      ...rules.i茅台,
      toQL: false,
      disabled: true,
    },
  ],
};

module.exports = config;
