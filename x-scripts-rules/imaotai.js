/** @type {import('../typings').RuleItem} */
module.exports = {
  ruleId: 'imaotai',
  desc: 'imaotai预约 token 获取',
  /** url 匹配规则 */
  url: '.moutai519.com.cn',
  /** 方法匹配 */
  method: '**',
  /** 是否上传至 青龙 环境变量配置 */
  toQL: true,
  /** 是否写入到环境变量配置文件中 */
  toEnvFile: true,
  /** 是否合并不同请求的缓存数据。默认为覆盖 */
  mergeCache: true,
  /** 获取当前用户唯一性的 uuid */
  getUid: ({ headers, url, cookieObj, req }) => {
    const deviceId = headers['mt-device-id'] || cookieObj['MT-Device-ID-Wap'];
    const data = { deviceId }; // city: 'x市', province: 'x省'

    if (cookieObj['MT-Token-Wap']) data.tokenWap = cookieObj['MT-Token-Wap'];
    if (headers['mt-lng']) data.lng = headers['mt-lng'];
    if (headers['mt-lat']) data.lat = headers['mt-lat'];
    if (headers['mt-token']) data.token = headers['mt-token'];

    return {
      /** user 唯一性标记 */
      uid: deviceId,
      /** 保存至缓存中的自定义数据。是可选的，主要用于需组合多个请求数据的复杂场景 */
      data,
    };
  },
  saveCookieHandler: ({ allCacheData }) => {
    const allUserData = allCacheData.map(d => d.data);
    // console.log('imaotai allUserData:', JSON.stringify(allUserData, null, 2));
    // const value = allUserData.map(d => `deviceId=${d.deviceId};token=${d.token};tokenWap=${d.tokenWap};city=x市;province=x省`).join('&');
    const value = allUserData.map(d => `deviceId=${d.deviceId};token=${d.token};tokenWap=${d.tokenWap}`).join('&');
    // 生成环境变量配置
    const envConfig = { name: 'QL_IMAOTAI', value: value, desc: 'imaotai cookie' };

    return { envConfig };
  },
};
