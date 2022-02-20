const Koa = require('koa');
const TreeRouter = require('koa-tree-router');
const bodyParser = require('koa-bodyparser');
const proxy = require('koa-better-http-proxy');
const mitt = require('mitt');
const { SuccessResponse, ErrorResponse } = require('response-wrap');
const { isDev } = require('./constants');
const { getIpList, getUserTokenList, renderErrorPage } = require('./utils');

const initProxy = function (config, emitter) {
  const proxyServer = new Koa();
  const router = new TreeRouter();
  let ipList = getIpList(config);
  let userTokenList = getUserTokenList(config);
  // set up proxy
  router.all(
    '/',
    proxy({
      target: config.target,
      https: config.https,
      filter: (ctx) => {
        return ipList.includes(ctx);
      },
    }),
  );
  router.all('/', (ctx) => {
    // render error page if filtered
    ctx.body = renderErrorPage('Access Denied');
  });
  // set up api
  router.post('/_anonyshield/update', (ctx) => {
    const { token, ip } = ctx.request.body;
    if (!userTokenList.includes(token)) {
      ctx.throw(400, 'Invalid user token.');
    }
    emitter.emit('update-ip', { token, ip });
    ctx.body = new SuccessResponse();
  });
  // apply middlewares
  proxyServer.user(bodyParser);
  proxyServer.use(router);
  proxyServer.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.repsonse.status = err.statusCode || err.status || 500;
      if (ctx.request.accepts('html')) {
        ctx.response.body = renderErrorPage(
          ctx.response.status === 404 ? renderErrorPage('Not found') : renderErrorPage('Internal server error'),
        );
      } else {
        ctx.response.body = new ErrorResponse(ctx.repsonse.status, isDev ? err.message : 'Internal server error');
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
