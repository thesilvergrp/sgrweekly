import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { ownerrezDevMiddleware } from './server/dev-middleware';

export default defineConfig(({ mode }) => {
  // Load .env / .env.local without the VITE_ prefix filter so the OwnerRez
  // credentials are available to the server-side middleware. These vars are
  // NOT exposed to the client bundle because they don't start with VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  process.env.OWNERREZ_USERNAME = env.OWNERREZ_USERNAME ?? process.env.OWNERREZ_USERNAME ?? '';
  process.env.OWNERREZ_PAT = env.OWNERREZ_PAT ?? process.env.OWNERREZ_PAT ?? '';

  return {
    plugins: [
      react(),
      {
        name: 'ownerrez-dev-api',
        configureServer(server) {
          server.middlewares.use(ownerrezDevMiddleware());
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
