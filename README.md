# BookKeeping

BookKeeping is organized as a lightweight monorepo for the Web app, native Android app, and future backend services.

## Repository Layout

- `apps/web`: React + Vite bookkeeping Web/PWA app.
- `apps/android`: Native Android/Kotlin app.
- `services/api`: Reserved for the future Go backend service.
- `packages`: Reserved for shared contracts, schemas, generated clients, or common tooling.

## Common Commands

Run commands from the repository root.

```sh
pnpm install
pnpm dev:web
pnpm build:web
pnpm build:android
pnpm build
pnpm run ci
```

## Notes

- Web remains the Docker-deployed application.
- Android is built in CI with Gradle Wrapper, but no APK/AAB publishing is configured yet.
- The future Go service should live in `services/api`; shared API contracts should live under `packages` when both apps need them.
- The previous root README content had historical Chinese text with encoding corruption. Preserve or rewrite that history in a separate documentation cleanup.
