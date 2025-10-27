const path = require('path');
const fs = require('fs');
// Load dotenv only for convenience: if a parent .env.local exists (repository root),
// read it so NEXT_PUBLIC_* variables are available to Next at dev/build time.
try {
  const parentEnv = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(parentEnv)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    dotenv.config({ path: parentEnv });
    console.log('Loaded env from', parentEnv);
  }
} catch (e) {
  // Don't crash the build if dotenv is missing or something goes wrong.
  // Next will still pick up real environment variables set in the shell.
  // eslint-disable-next-line no-console
  console.warn('Could not load parent .env.local for Next.js:', e && e.message ? e.message : e);
}

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Configure Turbopack root so Next resolves modules from the monorepo/project root
  // This silences the warning when multiple lockfiles are present and ensures
  // imports that live in the repository root (or sibling packages) resolve.
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  // // Enable static export build. This allows `next export` to produce an `out/` folder
  // // which can be served as a static site (for GitHub Pages). If your site will be
  // // hosted under a repository subpath (e.g. https://<user>.github.io/<repo>), set
  // // NEXT_PUBLIC_BASE_PATH to the subpath (for example: `/RHACbot`) when building.
  // output: 'export',
  // trailingSlash: true,
  // // Optionally set basePath / assetPrefix from env so exported assets work on repo pages
  // // Set NEXT_PUBLIC_BASE_PATH=/my-repo to enable. If empty, no basePath is applied.
  // ...(process.env.NEXT_PUBLIC_BASE_PATH
  //   ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH, assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH }
  //   : {}),
};
