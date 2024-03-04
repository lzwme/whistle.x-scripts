async function handler({ resBody, resHeader, reqBody, url, method, headers, X }) {
  return new Promise((resolve) => {
    const $done = (obj) => resolve(mock$Done(obj));
    const $response = {
      body: typeof resBody === 'string' ? resBody : JSON.stringify(resBody),
      headers: resHeader,
      url,
      method,
    }; // mock response
    const $request = { url, method, headers, body: reqBody ? JSON.stringify(body) : '' };
    // env mock
    const $environment = { 'stash-version': '1.0.0', 'surge-version': '1.0.0' };
    // const $task = {}; // Quantumult X
    // const $rocket = {}; // Shadowrocket

    // <js_placeholder>
  });
}

module.exports = handler;
