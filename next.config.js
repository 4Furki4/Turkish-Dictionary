const withNextIntl = require("next-intl/plugin")();
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["utfs.io"],
    }
};

module.exports = withNextIntl(nextConfig);
