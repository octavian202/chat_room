# Chat Room Frontend

Production-style React frontend for a real-time chat platform. This client is designed to deliver low-latency messaging, resilient UX under network instability, and maintainable component architecture suitable for portfolio and professional review.

---

## Elevator Pitch

This frontend enables users to enter a username, join any room, and chat in real time without refreshing the page. It combines instant message delivery with practical reliability features (connection status, graceful error handling, and chat history loading), which makes the app feel responsive and trustworthy in real usage.

For recruiters: this demonstrates an end-to-end product mindset, not just UI implementation.  
For engineers: this demonstrates event-driven UI state, WebSocket lifecycle management, and robust API integration patterns.

---

## What This Frontend Delivers

- Real-time room-based messaging using STOMP over SockJS.
- Chat history retrieval with pagination and infinite scroll behavior.
- Join/leave activity events integrated into the message timeline.
- Connection-aware UI (`connecting`, `connected`, `disconnected`, `error`).
- Centralized, user-friendly error normalization for API failures.
- Input validation and guardrails for username, room ID, and message length.
- Error boundary protection to contain runtime UI crashes.

---

## User Flow

1. User enters a validated display name.
2. User enters a validated room ID.
3. Frontend loads recent messages over HTTP (`/chat/{roomId}`).
4. Frontend opens a persistent WebSocket session (`/ws`) and subscribes to `/topic/chat/{roomId}`.
5. Messages are published to `/app/chat/{roomId}` and rendered live.
6. Scrolling upward fetches older pages while preserving viewport position.

---

## Architecture Overview

### Component-level design

- `src/App.tsx` orchestrates app state transitions: login -> room entry -> active chat.
- `src/components/Login.tsx` handles username input and validation.
- `src/components/RoomEntry.tsx` handles room selection and logout action.
- `src/components/ChatRoom.tsx` manages messaging, connection status, timeline state, and pagination.
- `src/components/ErrorBoundary.tsx` prevents full-app crashes from render-time exceptions.

### State strategy

This app intentionally uses local React state + hooks instead of introducing global state libraries. The state boundary is clear and pragmatic:

- Session scope: `username`, `roomId`.
- Chat scope: `messages`, `connectionStatus`, loading flags, and error channels.
- Behavior refs: scroll preservation and one-time auto-scroll control.

This keeps complexity low while still supporting non-trivial real-time behavior.

---

## Real-Time Messaging Strategy

- **Transport:** SockJS client + STOMP protocol (`@stomp/stompjs`).
- **Subscribe:** `/topic/chat/{roomId}` for room broadcasts.
- **Publish:** `/app/chat/{roomId}` for outbound events.
- **Lifecycle handling:** connection, disconnect, WebSocket errors, STOMP errors, and cleanup deactivation.
- **UX resilience:** send action is disabled when disconnected; user sees explicit status and actionable error messages.

### Why this matters

Real-time chat often fails at lifecycle edges (reconnect gaps, duplicate subscriptions, stale state). This implementation addresses those risks by keeping connection and room changes bound to effect cleanup and explicit status transitions.

---

## Message History & Scroll Behavior

The chat timeline supports paginated history loading without disorienting the user:

- Initial room load fetches page `0` of recent messages.
- Older messages are fetched when the user scrolls near the top.
- On prepend, scroll position is preserved by measuring previous and new container heights.
- End-of-history state is surfaced clearly (`No older messages`).

### Why this matters

Many chat UIs jump unexpectedly when prepending history. Preserving viewport continuity improves usability and reflects production-grade timeline handling.

---

## Error Handling & UX Reliability

Error handling is layered:

- **Transport-level:** WebSocket/STOMP callback errors.
- **HTTP-level:** Axios errors normalized in `src/api.ts`.
- **UI-level:** screen-level feedback banners and form validation messages.
- **Runtime-level:** React `ErrorBoundary` fallback for unexpected render failures.

The goal is consistent feedback without leaking raw backend/internal error details into the UI.

---

## Tech Stack (Frontend)

- **React 19 + TypeScript**: typed, component-driven UI with modern hooks.
- **Vite**: fast local iteration, optimized build output.
- **Axios**: REST calls for chat history and error-aware request handling.
- **@stomp/stompjs + SockJS**: real-time communication and transport compatibility.
- **ESLint**: static quality checks and React hooks safety rules.

---

## Backend Integration (Required Contract)

This client depends on these backend endpoints/contracts:

- **WebSocket endpoint:** `/ws`
- **STOMP application destination:** `/app/chat/{roomId}`
- **STOMP topic destination:** `/topic/chat/{roomId}`
- **REST history endpoint:** `GET /chat/{roomId}?pageNumber={n}&pageSize={m}`

Expected message shape:

```ts
type MessageType = 'TEXT' | 'JOINED' | 'LEFT';

interface ChatMessage {
  id?: number;
  sender: string;
  content: string;
  timestamp?: string;
  messageType: MessageType;
  roomId: string;
}
```

If the backend API URL is not the same origin, configure it through `VITE_API_BASE_URL`.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Running backend service (default expected: `http://localhost:8081`)

### Install

```bash
cd client
npm install
```

### Configure environment

Create or edit `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8081
```

### Run development server

```bash
npm run dev
```

The app runs on `http://localhost:5173`.  
Vite proxy forwards `/chat` and `/ws` to the configured backend target.

### Production build

```bash
npm run build
npm run preview
```

---

## Scripts

- `npm run dev` - start Vite dev server.
- `npm run build` - type-check and generate production bundle.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint across the codebase.

---

## Professional Highlights

- Implemented a clear, stage-based UX (`Login` -> `RoomEntry` -> `ChatRoom`) with isolated component responsibilities.
- Architected deterministic WebSocket session handling tied to room lifecycle.
- Optimized chat timeline behavior with prepend-safe infinite history loading.
- Integrated centralized error interpretation to keep user feedback consistent and useful.
- Applied defensive UI patterns (`ErrorBoundary`, disabled actions during invalid connection states).

---

## Future Enhancements

- Automatic reconnect with exponential backoff and retry visibility.
- Token-based auth integration for protected room access.
- Presence indicators and typing events.
- End-to-end tests for WebSocket workflows and history pagination.

