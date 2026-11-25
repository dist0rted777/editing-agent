import { Config } from "@remotion/cli/config";

// Low-overhead local defaults. Update concurrency after running:
// pnpm --filter @editing-agent/studio benchmark
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
