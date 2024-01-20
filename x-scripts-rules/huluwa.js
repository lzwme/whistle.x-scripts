const apps = {
  wxded2e7e6d60ac09d: { key: 'XLHG', channelId: '8', desc: '新联惠购' },
  wx61549642d715f361: { key: 'GLYP', channelId: '7', desc: '贵旅优品' },
  wx613ba8ea6a002aa8: { key: 'KGLG', channelId: '2', desc: '空港乐购' },
  wx936aa5357931e226: { key: 'HLQG', channelId: '6', desc: '航旅黔购' },
  wx624149b74233c99a: { key: 'ZXCS', channelId: '5', desc: '遵航出山' },
  wx5508e31ffe9366b8: { key: 'GYQP', channelId: '3', desc: '贵盐黔品' },
  wx821fb4d8604ed4d6: { key: 'LLSC', channelId: '1', desc: '乐旅商城' },
  wxee0ce83ab4b26f9c: { key: 'YLQX', channelId: '9', desc: '驿路黔寻' },
};

/**
 * 葫芦娃 token 自动提取保存或上传至青龙
 * @type {import('../typings').RuleItem}
 */
module.exports = {
  on: 'req-header',
  ruleId: 'huluwa',
  desc: '葫芦娃 x-access-token 获取',
  url: 'https://gw.huiqunchina.com/**',
  getCacheUid: ({ headers }) => {
    const appid = /miniProgram\/(wx\w+)/.exec(headers['user-agent'])?.[1];
    const token = headers['x-access-token'];
    if (appid && token) return { uid: token.split('.')[1], data: { token, appid } };
  },
  handler: ({ allCacheData, headers }) => {
    const appid = /miniProgram\/(wx\w+)/.exec(headers['user-agent'])?.[1];
    if (appid && apps[appid] && headers['x-access-token']) {
      const allUserData = allCacheData.map(d => d.data).filter(d => d.appid === appid);
      const value = allUserData.map(d => d.token).join('\n');
      const envConfig = { name: `${apps[appid].key}_COOKIE`, value, desc: apps[appid].desc + '-huluwa' };
      return { envConfig };
    }
  },
};
