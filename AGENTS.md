# AGENTS.md — inward-journey-ambient

Cinematic on-rails 3D flythrough for Android TV. Fixed camera paths, sound library, 10-foot UI.

## Build / verify
- `npm ci`, `npm run build` (vite → `dist/`), `npx tsc --noEmit`
- Serve `dist/` locally and boot the app; capture stills at fixed timestamps to verify each chapter.

## Hard rules
- WebGL ONLY. No WebGPU, no TSL nodes, no `three/webgpu` imports. Import three from `three` (standard build). TV hardware has no WebGPU.
- On-rails camera ONLY. Fixed spline paths per chapter. No free camera, no orbit controls, no open world.
- Performance budget: <100k visible triangles, no post-processing, no dynamic shadows, compressed textures. Must hold 30fps on a weak Mali TV GPU.
- Allowed: `src/`, `public/`, `index.html`, config files. Forbidden: nothing else at root.
- Commit and push to the session branch after each milestone. Work does not exist until pushed.
