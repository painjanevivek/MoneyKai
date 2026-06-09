const appJson = require('./app.json');

const smsResearchBuildEnabled = process.env.EXPO_PUBLIC_SMS_RESEARCH_BUILD === 'true';

const config = {
  ...appJson.expo,
};

if (smsResearchBuildEnabled) {
  config.plugins = [...config.plugins, './plugins/withMoneyKaiSmsResearch'];
}

module.exports = config;
