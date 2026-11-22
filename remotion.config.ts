import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

/**
 * The film renders the app's own components from ../lbs-ai-cup. Next.js-only modules are swapped
 * for small stand-ins, server actions for no-ops (nothing is ever saved), and React is pinned to
 * this project's copy so app components and Remotion share one React.
 */
const APP = path.resolve(process.cwd(), "../lbs-ai-cup");
const shim = (name: string) => path.resolve(process.cwd(), "src/shims", name);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setConcurrency(4);

Config.overrideWebpackConfig((current) =>
  enableTailwind({
    ...current,
    resolve: {
      ...current.resolve,
      // App packages (lucide-react, clsx…) come from the app's own node_modules.
      modules: [path.resolve(process.cwd(), "node_modules"), path.join(APP, "node_modules"), "node_modules"],
      alias: [
        { name: "@/lib/actions/planner", alias: shim("actions.ts"), onlyModule: true },
        { name: "@/lib/actions/admin", alias: shim("actions.ts"), onlyModule: true },
        { name: "next/link", alias: shim("next-link.tsx"), onlyModule: true },
        { name: "next/navigation", alias: shim("next-navigation.ts"), onlyModule: true },
        { name: "next/image", alias: shim("next-image.tsx"), onlyModule: true },
        { name: "server-only", alias: shim("empty.ts"), onlyModule: true },
        { name: "react", alias: path.resolve(process.cwd(), "node_modules/react") },
        { name: "react-dom", alias: path.resolve(process.cwd(), "node_modules/react-dom") },
        { name: "@", alias: path.join(APP, "src") },
      ],
    },
  }),
);
