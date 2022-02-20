const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

const errorPage = fs.readFileSync(path.resolve(__dirname, '../templates/error.html'), { encoding: 'utf8' });

const getIpList = (config) => {
  if (!Array.isArray(config?.users)) {
    return [];
  }
  return config.users.map((item) => item.ip);
};

const getUserTokenList = (config) => {
  if (!Array.isArray(config?.users)) {
    return [];
  }
  return config.users.map((item) => item.token);
};

const renderErrorPage = (error) => {
  return ejs.render(errorPage, { error });
};

module.exports = {
  getIpList,
  getUserTokenList,
  renderErrorPage,
};
