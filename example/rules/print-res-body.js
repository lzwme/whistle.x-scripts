/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
module.exports = {
  disabled: true, // 是否禁用该规则
  on: 'res-body', // 规则执行的时机，res-body 表示在收到响应体后触发
  ruleId: 'print-response-body', // 规则唯一标记，必须设置且唯一
  desc: '打印接口返回内容', // 规则描述
  url: '**', // ** 表示匹配所有 url 地址
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
    // return { body: modifyedResBody };
  },
};
