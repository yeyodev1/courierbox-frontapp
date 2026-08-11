/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const url: string;
  export default url;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
