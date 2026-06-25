const path = require('path');
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

const i18nPath = `./${path.relative(process.cwd(), path.join(__dirname, 'src/i18n/request.ts')).replace(/\\/g, '/')}`;
const withNextIntl = createNextIntlPlugin(i18nPath);

const nextConfig = { nx: {} };

module.exports = withNextIntl(composePlugins(...[withNx])(nextConfig));
