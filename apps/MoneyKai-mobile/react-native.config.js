module.exports = {
  project: {
    android: {
      packageName: 'com.moneykai.mobile',
    },
  },
  dependencies: {
    // Recipients are entered manually. Keeping this native package unlinked
    // prevents contact permissions from entering the Play bundle.
    'react-native-contacts': {
      platforms: {
        android: null,
      },
    },
  },
};
