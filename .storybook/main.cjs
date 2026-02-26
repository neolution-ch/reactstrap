const path = require('path');

module.exports = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.js'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-mdx-gfm',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  staticDirs: ['../static'],
  webpackFinal: async (config) => {
    // Explicitly add babel-loader for all project JS/JSX/CJS files
    // (Storybook 8's auto-configured rule may not cover all paths)
    config.module.rules.push({
      test: /\.(js|jsx|mjs|cjs)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
            ],
            plugins: [
              '@babel/plugin-proposal-export-default-from',
              '@babel/plugin-proposal-export-namespace-from',
              '@babel/plugin-proposal-object-rest-spread',
            ],
          },
        },
      ],
    });

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        reactstrap: path.resolve(__dirname, '../src/'),
      },
    };
    return config;
  },
};
