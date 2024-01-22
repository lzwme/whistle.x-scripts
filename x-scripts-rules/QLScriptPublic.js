/**
 * @type {import('../typings').RuleItem[]}
 */
module.exports = [
  {
    on: 'req-header',
    ruleId: 'hdl',
    method: '**',
    url: 'https://superapp-public.kiwa-tech.com/activity/wxapp/**',
    desc: '海底捞小程序签到 token',
    // getCacheUid: () => 'hdl',
    handler({ headers }) {
      // console.log('hdl', headers);
      if (headers['_haidilao_app_token']) {
        return { envConfig: { name: 'hdl_data', value: headers['_haidilao_app_token'] } };
      }
    },
  },
  {
    on: 'res-body',
    ruleId: 'mxbc_data',
    desc: '蜜雪冰城小程序 Access-Token',
    method: 'get',
    url: 'https://mxsa.mxbc.net/api/v1/customer/info*',
    getCacheUid: ({ resBody }) => resBody?.data?.customerId,
    handler({ allCacheData }) {
      const value = allCacheData.map(d => d.headers['access-token']).join('@');
      if (value) return { envConfig: { name: 'mxbc_data', value } };
    },
  },
  {
    on: 'req-header',
    ruleId: 'zbsxcx',
    desc: '植白说小程序 x-dts-token',
    method: 'get',
    url: 'https://www.kozbs.com/demo/wx/**/*?userId=**',
    getCacheUid: ({ url }) => /userId=(\d+)/.exec(url)?.[1],
    handler({ allCacheData }) {
      const value = allCacheData.map(d => d.headers['x-dts-token']).join('&');
      if (value) return { envConfig: { name: 'zbsxcx', value } };
    },
  },
];
