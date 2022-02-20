const path = require('path');
const fs = require('fs');
const AnonyShieldProxy = require('./src/proxy');

const startServer = () => {
  const configPath = path.resolve(__dirname, './anonyshield.config.json');
  const readConfig = () => {
    return JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
  };
  if (!fs.existsSync(configPath)) {
    throw new Error('Cannot find the configuration file (anonyshield.config.json).');
  }
  let config = readConfig();
  fs.watch(configPath, null, (e) => {
    if (e.type === 'change') {
      try {
        config = readConfig();
      } catch (err) {
        console.error('Failed to read configuration file.', err);
      }
    }
  });
  const proxyServer = new AnonyShieldProxy(config);
  proxyServer.emitter.on('update-ip', ({ token, ip }) => {
    const userIdx = config.users.findIndex((item) => item.token === token);
    if (userIdx >= 0) {
      config.users.ip = ip;
    }
    try {
      fs.writeFileSync(config, JSON.stringify(config), { encoding: 'utf-8' });
    } catch (err) {
      console.error('Failed to update configuration file.', err);
    }
  });
};

startServer();
