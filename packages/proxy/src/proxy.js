const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const proxy = require('koa-better-http-proxy');
const mitt = require('mitt');
const { SuccessResponse, ErrorResponse } = require('response-wrap');
const { isDev } = require('./constants');
const { getIpList, getUserTokenList, renderErrorPage } = require('./utils');

const initProxy = function (config, emitter) {
  const proxyServer = new Koa();
  let ipList = getIpList(config);
  let userTokenList = getUserTokenList(config);
  // apply middlewares
  proxyServer.user(bodyParser);
  proxyServer.use(async (ctx, next) => {
    // register update api
    if (ctx.path === '/_anonyshield/update' && ctx.method === 'POST') {
      const { token, ip } = ctx.request.body;
      if (!userTokenList.includes(token)) {
        ctx.throw(400, 'Invalid user token.');
      }
      emitter.emit('update-ip', { token, ip });
      ctx.body = new SuccessResponse();
      return;
    }
    await next();
  });
  proxyServer.use(
    proxy({
      target: config.target,
      https: config.https,
      filter: (ctx) => {
        return ipList.includes(ctx);
      },
    }),
  );
  proxyServer.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.statusCode || err.status || 500;
      if (ctx.request.accepts('html')) {
        if (ctx.status === 404) {
          if (ctx.path.startsWith('/_anonyshield')) {
            ctx.body = renderErrorPage('Not found');
          }
          return;
        }
        ctx.body = renderErrorPage('Internal server error');
      } else {
        if (ctx.response.status === 404) {
          if (ctx.path.startsWith('/_anonyshield')) {
            ctx.body = new ErrorResponse(404, 'Not found');
          }
          return;
        }
        ctx.body = new ErrorResponse(ctx.repsonse.status, isDev ? err.message : 'Internal server error');
      }
    }
  });
  // set up exposed methods
  proxyServer.update = (config) => {
    ipList = getIpList(config);
    userTokenList = getUserTokenList(config);
  };

  return proxyServer;
};

class AnonyShieldProxy {
  constructor(config) {
    this.config = config;
    this.emitter = mitt();
    this.proxy = initProxy(this.config, this.emitter);
  }
  start(port) {
    this.proxy.listen(port);
  }
  update(config) {
    this.config = config;
    this.proxy.update(config);
  }
}

module.exports = AnonyShieldProxy;
