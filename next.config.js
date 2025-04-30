const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["utfs.io", "bcpoot6w02.ufs.sh"],
    }
};

module.exports = withNextIntl(nextConfig);
