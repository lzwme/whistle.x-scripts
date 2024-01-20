/** @type {import('@lzwme/whistle.x-scripts').RuleItem} */
module.exports = {
  disabled: true,
  on: 'res-body',
  ruleId: 'print-response-body',
  desc: '打印接口返回内容',
  url: '**', // ** 表示匹配所有 url 地址
  handler({ url, req, reqBody, resHeaders, resBody, X }) {
    // X 是提供的工具类对象，方便简化脚本编写逻辑调用
    const { magenta, gray, cyan } = X.FeUtils.color;

    if (X.isText(req.headers) && !/\.(js|css)/.test(url)) {
      console.log(`\n\n[${magenta('handler')}][${cyan(req.method)}] -`, gray(url));
      console.log(cyan('\req headers:'), req.headers);
      console.log(cyan('\res headers:'), resHeaders);
      if (reqBody) console.log(cyan('请求参数：'), reqBody.toString());
      if (resBody) console.log(cyan('返回内容：'), resBody);
    }

    // 不返回数据表示忽略修改
    // return { body: modifyedResBody };
  },
};
