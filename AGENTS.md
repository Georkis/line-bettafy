# Betta Genealogy — Agent Guide

## Stack
- Quasar v2 (Vite CLI) + Vue 3 Composition API + Vue Router 5 + SCSS
- JavaScript, ESM (`"type": "module"`)
- ESLint flat config + Prettier (no semicolons, single quotes, printWidth 100)
- Capacitor v8 native mobile project in `src-capacitor/` (separate `package.json`)
- Pinia for state management
- `@capacitor-community/sqlite` for local SQLite database
- `@capacitor/camera` + `@capacitor/filesystem` for photos
- pnpm, npm, and yarn all supported (workspace config via `pnpm-workspace.yaml`)

## Commands
| Command | What |
|---|---|
| `npm run dev` | Dev server with HMR (opens browser, ESLint feedback via vite-plugin-checker) |
| `npm run build` | Production build |
| `npm run lint` | ESLint on `./src*/**/*.{js,cjs,mjs,vue}` |
| `npm run format` | Prettier write |
| `npm test` | No-op (no test framework) |

Postinstall runs `quasar prepare` automatically (generates `.quasar/` directory).

## Project layout
```
src/
  App.vue               → root component (<router-view />)
  router/index.js       → router setup (hash mode)
  router/routes.js      → lazy-loaded routes
  layouts/MainLayout.vue → shell with nav drawer
  pages/
    Dashboard.vue       → summary stats, recent bettas & cruces
    Bettas.vue          → list with search/filter/create/edit/delete
    BettaDetail.vue     → single betta with photos & related cruces
    Reproducciones.vue  → cruces list with create/edit/delete
    Genealogia.vue      → tree view for selected betta
    Estadisticas.vue    → aggregated stats by sexo, estado, tipo, etc.
    Configuracion.vue   → theme, preferences, backup export
  components/
    BettaCard.vue       → betta preview card (used in grids)
    BettaForm.vue       → create/edit betta form dialog
    ReproductionForm.vue → create/edit cruce form dialog
    TreeView.vue        → recursive genealogy tree
    Gallery.vue         → photo grid with add/delete
  services/
    sqlite.js           → DB init, query/run helpers, export
    photo.js            → camera capture, filesystem read/write/delete
    genealogy.js        → parents, children, siblings, tree builder
  stores/
    bettas.js           → CRUD, search, filter, stats
    reproducciones.js   → CRUD, lookup by betta, stats
    configuracion.js    → user preferences, backup export
  boot/
    pinia.js            → registers Pinia with app
    sqlite.js           → initializes database on startup
  css/                  → app.scss, quasar.variables.scss
```

## Database Schema
- **bettas**: id, codigo, nombre, sexo, tipo, variedad, color, origen, criador, fecha_nacimiento, estado, padre_id, madre_id, foto_principal, observaciones, created_at, updated_at
- **fotos**: id, betta_id, ruta, descripcion, fecha
- **reproducciones**: id, macho_id, hembra_id, fecha_cruce, fecha_desove, cantidad_alevines, observaciones, created_at, updated_at

Genealogy uses adjacency list via `padre_id` / `madre_id` (no separate descendants table).

## Quasar conventions
- Quasar components are auto-imported — no manual registration needed
- Use `~assets/` alias for asset imports
- SCSS variables in `src/css/quasar.variables.scss` override Quasar theme
- Router mode: `hash` (quasar.config.js → `vueRouterMode: 'hash'`)
- Framework plugins enabled: `Notify`, `BottomSheet`, `LocalStorage`, `SessionStorage`

## Code style
- `.editorconfig`: 2-space indent, UTF-8, LF, trailing newline
- `.vscode/settings.json` has formatOnSave + eslint autofix
- ESLint: `pluginVue.configs['flat/essential']` + Quasar recommended
- All components use `<script setup>` (Composition API)

## Notable
- DB initialized in `boot/sqlite.js` before any page loads
- Photo paths stored as relative filesystem paths (Directory.Data/betta_photos/)
- No test framework configured
- Lint → format (no typecheck step)
- `.quasar/` and `dist/` are gitignored generated directories
