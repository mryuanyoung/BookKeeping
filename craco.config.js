const sassResourcesLoader = require('craco-sass-resources-loader');
const path = require('path');

module.exports = {
  plugins: [
    {
      plugin: sassResourcesLoader,
      options: {
        resources: './src/global.scss',
      },
    },
  ],
  webpack: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@hooks': path.resolve(__dirname, 'src/hooks/'),
      '@constants': path.resolve(__dirname, 'src/constants/'),
      '@assets': path.resolve(__dirname, 'src/assets/'),
      '@pages': path.resolve(__dirname, 'src/pages/'),
      '@PO': path.resolve(__dirname, 'src/PO/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces/'),
    },
  },
};
