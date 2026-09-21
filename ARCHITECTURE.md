# Architecture

This project is intentionally structured as a lightweight front-end application with browser APIs only for Phase 1.

## Core layout

- `src/main.ts` bootstraps the UI.
- `src/ui/home.ts` renders the landing experience.
- `src/styles.css` contains the responsive design system.

## Planned module layout

- `src/app` for app routing and state
- `src/network` for WebRTC signaling and connection handling
- `src/crypto` for application-level encryption
- `src/qr` for pairing payloads and QR generation/scanning
- `src/transfer` for file chunking and integrity checks
- `src/storage` for IndexedDB / OPFS storage

## Design principles

- Local-first, offline-friendly operation
- No cloud upload requirement
- Clear separation between browser capability and optional local-host enhancements
- Browser feature detection over browser sniffing
