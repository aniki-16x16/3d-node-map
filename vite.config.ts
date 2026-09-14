import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Keep exact versions here so deployed builds never resolve a moving CDN tag.
const reactVersion = "19.3.0";
const threeVersion = "0.180.0";
const reactUrl = `https://esm.sh/react@${reactVersion}`;
const reactDomUrl = `https://esm.sh/react-dom@${reactVersion}`;
const reactDomOptions =
  "external=react,react-dom&deps=scheduler@0.28.0&target=es2022";
const imports = {
  react: `${reactUrl}?target=es2022`,
  "react/jsx-runtime": `${reactUrl}/jsx-runtime?external=react&target=es2022`,
  "react/jsx-dev-runtime": `${reactUrl}/jsx-dev-runtime?external=react&target=es2022`,
  "react-dom": `${reactDomUrl}?external=react&target=es2022`,
  "react-dom/client": `${reactDomUrl}/client?${reactDomOptions}`,
  "react-dom/server": `${reactDomUrl}/server.browser?${reactDomOptions}`,
  three: `https://cdn.jsdelivr.net/npm/three@${threeVersion}/build/three.module.js`,
  "three/": `https://cdn.jsdelivr.net/npm/three@${threeVersion}/`,
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: "production-cdn-imports",
      apply: "build",
      transformIndexHtml: {
        order: "post",
        handler: () => [
          {
            tag: "script",
            attrs: { type: "importmap" },
            children: JSON.stringify({ imports }),
            injectTo: "head-prepend",
          },
        ],
      },
    },
  ],
  build: {
    rollupOptions: {
      external: /^(?:react|react-dom|three)(?:\/|$)/,
    },
  },
});
