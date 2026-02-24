/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wsqrhxgulnyolscuptiu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Forza il rendering dinamico per tutte le pagine
  // evita che Next.js tenti di prerenderizzare pagine che usano Supabase
  experimental: {
    serverComponentsExternalPackages: ["@supabase/ssr"],
  },
}

module.exports = nextConfig
