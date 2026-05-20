/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    '/view/*': ['./public/fonts/**/*', './public/apple-icon.png'],
    '/view/folder/*': ['./public/fonts/**/*', './public/apple-icon.png'],
  },
}

export default nextConfig
