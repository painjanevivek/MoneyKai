module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    './scripts/inline-public-env.cjs',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/assets': './assets',
        },
        extensions: ['.ios.js', '.android.js', '.js', '.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.json'],
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
