/* global __dirname, module, process, require */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const parseDotEnv = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[key] = value;
      return values;
    }, {});
};

const dotenvValues = parseDotEnv(path.resolve(__dirname, '../.env'));
const publicEnv = { ...dotenvValues, ...process.env };

module.exports = ({ types: t }) => ({
  name: 'moneykai-inline-public-env',
  visitor: {
    MemberExpression(pathToMember) {
      const { node } = pathToMember;
      if (
        node.computed ||
        !t.isIdentifier(node.property) ||
        !node.property.name.startsWith('EXPO_PUBLIC_') ||
        !t.isMemberExpression(node.object) ||
        !t.isIdentifier(node.object.property, { name: 'env' }) ||
        !t.isIdentifier(node.object.object, { name: 'process' })
      ) {
        return;
      }

      const value = publicEnv[node.property.name] ?? '';
      pathToMember.replaceWith(t.stringLiteral(String(value)));
    },
  },
});
