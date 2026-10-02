module.exports = {
  project: {
    android: {
      packageName: 'com.moneykai.mobile',
    },
  },
  // Contacts are explicitly requested by the person picker. Keep the native
  // module autolinked; excluding Android makes every authorized read fail.
};
