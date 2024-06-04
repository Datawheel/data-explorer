/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    BUILD_VERSION: "x.y.z",
    TESSERACT_SOURCE: "https://api.datasaudi.sa/",
  }
};

module.exports = {
  ...nextConfig,
};
