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
      /** 保存缓存数据ID，应唯一 */
      cacheId: 'JD_COOKIE',
      desc: '京东 cookie 自动抓取并同步至青龙环境变量',
      /** url 匹配规则 */
      url: 'api.m.jd.com',
      /** 请求方法匹配 */
      method: '',
      // getUserUuid: (headers, url, cookieObj, req) => cookieObj.pt_pin,
      /** 获取当前用户唯一性的 uid */
      getUserUuid: (headers, url, cookieObj, req) => {
        // console.log('getUserUuid:', url, cookieObj);
        // todo: wskey 转换
        // if (cookieObj.wskey) {}

        return { uid: cookieObj.pt_pin, data: cookieObj };
      },
      /** 规则处理并返回环境变量配置。可以数组的形式返回多个 */
      handler: (allCacheData, headers, url, cookieObj, req) => {
        if (!cookieObj.pt_pin || !cookieObj.pt_key) return;

        // 生成环境变量配置
        const envConfig = {
          name: 'JD_COOKIE',
          // value: allCacheData.map(d => d.headers.cookie).join('&'),
          value: allCacheData.map(d => `pt_key=${d.data.pt_key};pt_pin=${d.data.pt_pin}`).join('&'),
          desc: '京东 cookie',
        };

        // 可以根据需要返回多个环境变量的配置
        return [envConfig];
      },
      /** 更新处理已存在的环境变量，返回合并后的结果。若无需修改则可返回空 */
      updateEnvValue(envConfig, oldValue) {
        const oldValues = oldValue.includes('&') ? oldValue.split('&') : oldValue.split('\n');

        for (const cookie of oldValues) {
          const pt_pin = cookie.match(/pt_pin=(\w+)/)?.[0];
          if (pt_pin && !envConfig.value.includes(pt_pin)) envConfig.value += `&${cookie}`;
        }

        return envConfig.value;
      },
    },
    {
      cacheId: 'imaotai',
      desc: 'imaotai预约 cookie 获取',
      /** url 匹配规则 */
      url: '.moutai519.com.cn',
      /** 方法匹配 */
      method: '**',
      /** 是否上传至 青龙 环境变量配置 */
      toQL: false,
      /** 是否写入到环境变量配置文件中 */
      toEnvFile: true,
      /** 是否合并不同请求的缓存数据。默认为覆盖 */
      mergeCache: true,
      /** 获取当前用户唯一性的 uuid */
      getUserUuid: (headers, url, cookieObj, req) => {
        const deviceId = headers['mt-device-id'] || cookieObj['MT-Device-ID-Wap'];
        const data = { deviceId };

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
      handler: (allCacheData, headers, url, cookieObj, req) => {
        const allUserData = allCacheData.map(d => d.data);
        console.log(JSON.stringify(allUserData, null, 2));

        const value = allCacheData.map(d => `deviceId=${d.data.deviceId};token=${d.data.token};tokenWap=${d.data.tokenWap}`).join('&');
        // 生成环境变量配置
        const envConfig = {
          name: 'QL_IMAOTAI',
          value: value,
          desc: 'imaotai cookie',
        };

        return envConfig;
      },
    },
  ],
};

module.exports = config;
