# Pro Studio

Production-oriented Sports Content Creation app inspired by Canva workflows and built for matchday graphics, lineups, player announcements, statistics, fixtures, social posts, and thumbnails.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS dark sports editor UI
- PostgreSQL + Prisma ORM
- JWT authentication with access token and secure HTTP-only refresh cookie
- Zustand editor state
- React-Konva canvas editor (declarative element model)
- Zod validation
- Sharp-ready image/export pipeline
- Local storage abstraction with future S3/R2 adapters
- Vitest and Playwright

## Run locally

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open http://localhost:3000.

Seed users:

- `admin@prostudio.dev` / `password123`
- `user@prostudio.dev` / `password123`

## Features implemented

- Auth: register, login, refresh, logout, current user, forgot/reset endpoints, bcrypt, rate-limited login.
- Dashboard: recent projects, search, create design modal, project cards.
- Template system: Prisma schema, API routes, six seed sports templates, template-to-project endpoint.
- Editor: screenshot-inspired dark layout, primary sidebar, content panel, Konva canvas, toolbar, layers panel, zoom controls, keyboard shortcuts, autosave recovery.
- Canvas actions: add/select/move/resize/rotate/delete/duplicate/copy/paste/cut/select-all/group/ungroup/undo/redo, layer JSON serialization.
- **Advanced Editor Features (NEW):**
  - **Image Filters:** 10 presets (Vivid, B&W, Sepia, Cool, Warm, Vintage, etc.) + manual controls (brightness, contrast, saturation, hue, blur)
  - **Gradient Fills:** Linear & radial gradients with 10 presets + custom multi-stop color picker
  - **Alignment & Snapping:** Visual guides + smart snap-to-canvas/objects + 6 alignment buttons
  - **Text Effects:** Drop shadow, stroke/outline, and glow effects with full control
  - **Crop Tool:** Interactive crop with 7 aspect ratio presets (1:1, 16:9, 4:3, etc.)
- Uploads: local storage adapter, validation, upload API, background removal abstraction with mock adapter.
- Export: PNG/JPG/SVG client export, export-job API for server-side pipeline.
- Sharing: secure public token link, viewer route, revoke route.
- Admin: overview plus users/templates/assets/export routes and pages.
- Docker: app + PostgreSQL compose and production Dockerfile.

## Canvas Editor Features

Pro Studio now includes **Canva-like** editing capabilities:

📖 **Full Documentation:** See [CANVAS_EDITOR_FEATURES.md](./CANVAS_EDITOR_FEATURES.md) for complete feature guide  
👨‍💻 **Developer Guide:** See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for implementation details  
📋 **Changelog:** See [CHANGELOG_CANVAS_EDITOR.md](./CHANGELOG_CANVAS_EDITOR.md) for version history

### Quick Feature Overview

| Feature | Description | Access |
|---------|-------------|--------|
| 🎨 **Image Filters** | 10 presets + manual controls | Filters tab → Select image |
| 🌈 **Gradient Fills** | Linear/Radial with presets | Gradients tab → Select shape |
| 📐 **Alignment Guides** | Auto-snap + manual align | Drag objects / Toolbar buttons |
| ✨ **Text Effects** | Shadow, Stroke, Glow | Layers panel → Select text |
| ✂️ **Crop Tool** | 7 aspect ratios + free crop | Layers panel → Crop Image button |

### Keyboard Shortcuts

- `Cmd/Ctrl + D` - Duplicate
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + G` - Group
- `Cmd/Ctrl + Shift + G` - Ungroup
- `Delete/Backspace` - Delete selected
- `Arrow Keys` - Move 1px (hold Shift for 10px)
- `Enter` - Apply crop (in crop mode)
- `Esc` - Cancel crop (in crop mode)

## Database Credential Error

If you see `Authentication failed against database server at localhost` for user `prostudio`, your local PostgreSQL does not have the default role/password from `.env.example`. Fix it using one of these options:

1. Update `DATABASE_URL` in `.env` to match your real local PostgreSQL username, password, host, port, and database.
2. Or create the default development role/database by running this as a PostgreSQL superuser:

```bash
psql -U postgres -f scripts/setup-postgres.sql
```

Then run:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Useful commands

```bash
npm run dev
npm run build
npm run test
npm run test:e2e
npm run typecheck
npm run prisma:seed
```

## Notes

The editor intentionally uses React-Konva directly instead of a paid editor service. The canvas renders from a serializable element scene held in the Zustand store, and legacy Fabric.js project documents are migrated on load. PDF/high-resolution export has an API job model and can be extended with Sharp or a server renderer. The background-removal service uses a mock adapter in development and is isolated behind `removeBackground(imageUrl)` for remove.bg, Clipdrop, Replicate, or a self-hosted model.
