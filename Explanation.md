# Explanation

## What is this project?

This repository is a **training project** designed to teach developers how to use **GitHub Copilot Agents** and the **Model Context Protocol (MCP)** through hands-on experience. It contains a fully functional full-stack web application called **Book Favorites App**, which serves as the subject of various coding exercises and demonstrations.

---

## The Application: Book Favorites App

**Book Favorites App** is a full-stack web application that allows users to:

- **Register** a new account or **log in** with existing credentials.
- **Browse** a curated catalogue of 50 books (title and author).
- **Add books** to their personal favorites list.
- **View** their favorite books in a dedicated section.
- **Experience protected routes** — only authenticated users can access the books and favorites pages.

### Architecture

The application is split into two main parts:

| Layer | Technology | Port |
|-------|-----------|------|
| **Frontend** | React 19, Redux Toolkit, React Router, Vite | 5173 |
| **Backend** | Node.js, Express.js, JWT, JSON file storage | 4000 |

#### Frontend
- Built with **React** and **Vite** for a fast, modern development experience.
- Uses **Redux Toolkit** for state management (user authentication, books list, favorites).
- Client-side routing with **React Router**, including protected routes.
- JWT tokens are stored in `localStorage` and sent as `Authorization: Bearer` headers.
- Styled with **CSS Modules** for scoped, modular styles.

#### Backend
- **Express.js** REST API with three main resource groups:
  - `/register` and `/login` — public authentication endpoints.
  - `/books` — public endpoint returning the list of 50 books.
  - `/favorites` — protected endpoint (JWT required) for reading and adding user favorites.
- **JWT** is used for stateless authentication.
- Data is persisted in plain **JSON files** (`books.json`, `users.json`) to keep the setup simple.
- **CORS** enabled for frontend–backend communication.

#### Data Flow
1. A user registers or logs in → the backend returns a JWT token.
2. The frontend stores the token and includes it in every subsequent request.
3. Browsing books is open to all authenticated users.
4. Adding or viewing favorites requires a valid JWT to be present.

---

## The Training Content

Beyond the application itself, this repository includes structured training material:

### Demos (`/demos`)
Five trainer-led demonstration scenarios showing different ways GitHub Copilot Agents can assist in development:

| Demo | Topic |
|------|-------|
| `01-coding-agent-basic.md` | Add a basic feature using the Copilot Coding Agent |
| `02-coding-agent-medium.md` | Add a medium-complexity feature using the Coding Agent |
| `11-agent-mode-basic.md` | Use Chat Agent Mode for a basic feature |
| `12-coding-agent-advanced.md` | Copilot Coding Agent + MCP for security alerts |
| `13-agent-mode-advanced.md` | Chat Agent Mode + MCP for a medium-complexity feature |

### Hands-on Exercises (`/hands-on`)
Five participant exercises (estimated 45–60 minutes total):

| Exercise | Feature to Build |
|----------|-----------------|
| Exercise 1 | Clear All Favorites |
| Exercise 2 | Sorting books |
| Exercise 3 | Book reviews |
| Exercise 4 | Book search |
| Exercise 5 | Book categories |

---

## Testing

The project includes both unit/integration tests and end-to-end tests:

| Type | Framework | Command |
|------|-----------|---------|
| Backend (unit/integration) | Jest + Supertest | `npm run test:backend` |
| Frontend (E2E) | Cypress | `npm run build:frontend && npm run test:frontend` |
| Both | — | `npm run test` |

---

## Quick Start

```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..

# 2. Start the backend (terminal 1)
npm run start:backend   # http://localhost:4000

# 3. Start the frontend (terminal 2)
npm run start:frontend  # http://localhost:5173

# 4. Log in with the pre-seeded demo account (see users.json for credentials)
```

---

## Key Design Decisions

- **No database** — JSON files are used intentionally to keep setup friction low during training.
- **Hardcoded JWT secret** — acceptable for a local demo only. In any real application the secret must be loaded from a secure environment variable and must never be committed to source control.
- **Plain-text passwords** — intentional simplification for training purposes only. A production application must always hash passwords (e.g., with bcrypt) before storing them.
- **Modular structure** — clear separation between frontend and backend, and between routes, to make AI-assisted feature additions straightforward.

> ⚠️ **Security notice:** This project is intentionally simplified for training purposes and is **not suitable for production use**. Do not deploy it publicly or reuse its authentication patterns (hardcoded secrets, plain-text passwords) in any real-world application.
