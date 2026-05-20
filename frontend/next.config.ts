import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Map the server-side FUNCTION_APP_URL app setting (set by Terraform on Azure App Service)
  // to a NEXT_PUBLIC_ variable so browser-side code can access it.
  // Falls back to localhost for local development.
  env: {
    NEXT_PUBLIC_FUNCTION_APP_URL:
      process.env.FUNCTION_APP_URL ?? 'http://localhost:7071',
  },
};

export default nextConfig;
