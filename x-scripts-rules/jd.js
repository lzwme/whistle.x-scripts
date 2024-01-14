// @ts-check
/** 最近一次的 pin 账号，用于标记 wskey */
let pre_pt_pin = '';
/**
 * 京东 cookie 自动获取上传至青龙面板
 * WAP登录： https://bean.m.jd.com/bean/signIndex.action
 * @type {import('../typings').RuleItem[]}
 */
module.exports = [
  {
    disabled: false,
    /** 保存缓存数据ID，应唯一 */
    ruleId: 'JD_COOKIE',
    desc: '京东 cookie 自动抓取并同步至青龙环境变量',
    /** url 匹配规则 */
    url: '.jd.com',
    /** 请求方法匹配 */
    method: '*',
    toQL: true,
    toEnvFile: true,
    mergeCache: false,
    /** 获取当前用户唯一性的 uid */
    getUid: ({ cookieObj, headers, url, req }) => {
      let uid = cookieObj.pt_pin || cookieObj.pin;
      if (!uid && cookieObj.wskey && pre_pt_pin) uid = pre_pt_pin;

      if (uid && !uid.startsWith('netdiag') && !uid.startsWith('***')) {
        pre_pt_pin = uid;
        return { uid, data: cookieObj };
      }
    },
    /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
    handler: ({ allCacheData, cookieObj, headers, url, X }) => {
      if (!cookieObj || !allCacheData || (!cookieObj.pt_pin && !cookieObj.wskey)) return;

      // 生成环境变量配置
      const envConfig = [
        {
          name: 'JD_COOKIE',
          // value: allCacheData.filter(d => d.data.pt_pin).map(d => d.headers.cookie).join('&'),
          value: allCacheData
            .filter(d => d.data.pt_pin)
            .map(d => X.cookieStringfiy(d.data, { onlyKeys: [/^pt_/, 'visitkey'] }) + ';')
            .join('&'),
          desc: '京东 cookie',
        },
      ];

      if (cookieObj.pin && cookieObj.wskey) {
        envConfig.push({
          name: 'JD_WSCK',
          value: allCacheData
            .filter(d => d.data.wskey)
            .map(d => X.cookieStringfiy(d.data, { onlyKeys: ['pin', 'wskey'] }) + ';')
            .join('&'),
          desc: '京东 wskey',
        });
      }

      return { envConfig };
    },
    /** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
    updateEnvValue({ value }, oldValue, X) {
      const pt_pin = value.match(/pin=([^;]+)/)?.[0];
      if (!pt_pin) return;
      const sep = oldValue.includes('\n') ? '\n' : '&';
      const oldValues = oldValue.split(sep);
      const idx = oldValues.findIndex(cookie => cookie.includes(pt_pin));
      idx === -1 ? oldValues.unshift(value) : (oldValues[idx] = value);
      return oldValues.join(sep);
    },
  },
  {
    desc: '签到有礼超级无线-七天签到LZKJ_SEVENDAY',
    ruleId: 'LZKJ_SEVENDAY',
    method: 'get',
    url: 'https://lzkj-isv.isvjcloud.com/sign/sevenDay/signActivity?activityId=',
    getUid: ({ url }) => new URL(url).searchParams.get('activityId'),
    saveCookieHandler({ allCacheData }) {
      return { envConfig: { value: allCacheData.map(d => d.uid).join(','), name: 'LZKJ_SEVENDAY' } };
    },
  },
  {
    desc: '签到有礼超级无线-CJHY_SEVENDAY',
    ruleId: 'CJHY_SEVENDAY',
    method: 'get',
    url: 'https://cjhy-isv.isvjcloud.com/sign/sevenDay/signActivity?activityId=',
    getUid: ({ url }) => new URL(url).searchParams.get('activityId'),
    saveCookieHandler: ({ allCacheData: A }) => ({ value: A.map(d => d.uid).join(','), name: 'CJHY_SEVENDAY' }), // 可以直接返回 envConfig
  },
  {
    desc: 'lzkj签到有礼-activityId',
    ruleId: 'jd_lzkj_signActivity2_ids',
    url: 'https://lzkj-isv.isvjcloud.com/sign/signActivity2?activityId=',
    getUid: ({ url }) => new URL(url).searchParams.get('activityId'),
    saveCookieHander({ allCacheData }) {
      return { value: allCacheData.map(d => d.uid).join(','), desc: 'lzkj签到有礼 ids', name: 'jd_lzkj_signActivity2_ids' };
    },
    saveCookieHandler({ allCacheData }) {
      return [
        { value: allCacheData.map(d => d.uid).join('&'), name: 'jd_lzkj_signActivity2_ids', desc: 'lzkj签到有礼' },
        { value: allCacheData.map(d => d.uid).join(','), name: 'LZKJ_SIGN', desc: '签到有礼超级无线-LZKJ_SIGN' },
      ];
    },
  },
  {
    desc: 'cjhy签到有礼-activityId',
    ruleId: 'jd_cjhy_signActivity_ids',
    url: 'https://cjhy-isv.isvjcloud.com/wxActionCommon/getUserInfo',
    method: 'post',
    getUid: ({ headers }) => {
      if (headers.referer) return new URL(headers.referer).searchParams.get('activityId');
    },
    saveCookieHandler({ allCacheData }) {
      return [
        { value: allCacheData.map(d => d.uid).join('&'), name: 'jd_cjhy_signActivity_ids', desc: 'cjhy签到有礼' },
        { value: allCacheData.map(d => d.uid).join(','), name: 'CJHY_SIGN', desc: '签到有礼超级无线-CJHY_SIGN' },
      ];
    },
  },
];
