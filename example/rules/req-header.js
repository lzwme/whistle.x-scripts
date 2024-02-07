/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
module.exports = {
  on: 'req-header',
  ruleId: 'hdl_data',
  method: '**',
  url: 'https://superapp-public.kiwa-tech.com/activity/wxapp/**',
  desc: '海底捞小程序签到 token',
  handler({ headers }) {
    if (headers['_haidilao_app_token']) return { envConfig: { value: headers['_haidilao_app_token'] } };
  },
};
