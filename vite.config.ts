import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import voyageProxy from "./server/voyageProxy.js";

export default defineConfig({
  vite: {
    plugins: [voyageProxy()],
    server: {
      port: 3000,
      host: "0.0.0.0",
      strictPort: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
