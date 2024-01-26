/** @type {import('@lzwme/whistle.x-scripts').W2XScriptsConfig} */
const config = {
  // debug: false,
  // logType: 'info',
  // ql: {
  //   enable: false,
  //   token: '',
  // },
  /** 写入环境变量信息到本地文件 */
  // envConfFile: 'env-config.sh',
  /** 写入环境变量信息到本地文件的路径。若设置为空则不写入 */
  // cacheFile: 'w2.x-scripts.cache.json',
  /** 数据处理防抖时间间隔。单位为秒，默认为 10 (s) */
  throttleTime: 10,
  /** 指定规则集文件路径或所在目录，尝试从该列表加载自定义的规则集 */
  ruleDirs: [
    // require.resolve('@lzwme/x-scripts-rules', { paths: require.main.paths }),
    './local-x-scripts-rules',
  ],
  /** 自定义脚本规则 */
  rules: [
    // ...rules,
    {
      on: 'req-body',
      ruleId: 'rule-test',
      desc: '这是一条测试规则示例',
      method: '*',
      url: '**',
      toQL: false,
      toEnvFile: true,
      handler({ url, req, reqBody, resHeaders, resBody, X }) {
        // 只处理文本类型的请求
        if (X.isText(req.headers) && !/\.(js|css)/.test(url)) {
          // X 是提供的工具类对象，方便简化脚本编写逻辑调用
          const { magenta, gray, cyan } = X.FeUtils.color;

          console.log(`\n\n[${magenta('handler')}][${cyan(req.method)}] -`, gray(url));
          console.log(cyan('\req headers:'), req.headers);
          console.log(cyan('\res headers:'), resHeaders);
          if (reqBody) console.log(cyan('请求参数：'), reqBody.toString());
          if (resBody) console.log(cyan('返回内容：'), resBody);
        }

        // 若返回 body 参数则会以该内容返回
        // 若返回 envConfig 参数则会以该内容写入环境变量文件
        // return { body: modifyedResBody, envConfig };
      },
    },
  ],
};

module.exports = config;
