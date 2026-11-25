# Editing Agent

Registry-driven AI motion-graphics editing pipeline.

## Architecture
- `packages/schema`: Strict Zod contracts (EditBlueprint, ComponentManifest, BrandTokens).
- `packages/registry`: Plug-and-play motion graphics components (Remocn, Remotion Elements, custom TSX).
- `packages/skills`: Modular Markdown motion-direction style packs.
- `packages/brand`: Company `brand.json` tokens and logo assets.
- `apps/api`: Backend AI Director API (reads registry + skills + brand dynamically).
- `apps/studio`: Local Remotion preview & low-overhead MP4 renderer.
- `scripts/preprocess.ts`: FFmpeg 720p proxy + 16kHz mono audio extractor.

## Quick Start
1. `pnpm install`
2. Copy `.env.example` to `.env` and add your API keys.
3. Run `pnpm dev:api` to inspect registered components and style skills.
4. Run `pnpm --filter @editing-agent/studio benchmark` once to tune local render concurrency.
