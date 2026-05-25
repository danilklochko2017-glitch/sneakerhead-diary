/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Notion-hosted file attachments (S3 signed URLs)
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      // Notion image blocks served via Notion CDN
      {
        protocol: "https",
        hostname: "*.notion.so",
      },
      {
        protocol: "https",
        hostname: "*.notion.com",
      },
      // Notion image proxy
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
    ],
  },
};

export default nextConfig;
