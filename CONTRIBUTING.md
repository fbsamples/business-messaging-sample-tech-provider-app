# Contributing to Business Messaging Sample Tech Provider App

Thank you for your interest in contributing! This project serves as a **reference implementation** for Meta Business Messaging tech providers. Because developers will model their own integrations after this code, we hold it to a high standard of clarity, correctness, and security.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style](#code-style)
- [TypeScript](#typescript)
- [React and Next.js Patterns](#react-and-nextjs-patterns)
- [API Routes](#api-routes)
- [Error Handling](#error-handling)
- [Security](#security)
- [Logging](#logging)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your credentials
3. Install dependencies: `npm install`
4. Run the dev server: `npm run dev`
5. Verify your changes pass linting and type-checking: `npm run lint:all`

---

## Code Style

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `SendMessage.tsx` |
| Utility files | camelCase | `beUtils.ts`, `feUtils.ts` |
| Route directories | kebab-case | `request-code/`, `verify-code/` |
| Page directories | kebab-case | `my-inbox/`, `my-wabas/` |
| Variables and functions | camelCase | `accessToken`, `getWabaDetails()` |
| Types and interfaces | PascalCase | `WabaDetails`, `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Database columns | snake_case | `access_token`, `waba_id` |

**On the boundary between JS and SQL**: Use camelCase in TypeScript code. When constructing SQL queries, map to snake_case column names. Do not carry snake_case into variable names just because the database column uses it.

### Formatting

- Use 2-space indentation (enforced by the editor config)
- Use single quotes for strings
- Include trailing commas in multi-line arrays and objects
- Add a trailing newline to all files
- Use Unix-style line endings (`\n`)

### Imports

Organize imports in this order, separated by blank lines:

```typescript
// 1. React / Next.js framework imports
import { NextRequest, NextResponse } from 'next/server';

// 2. Third-party libraries
import Ably from 'ably';

// 3. Internal modules (use the @/ path alias, not relative paths)
import { withAuth } from '@/app/api/authWrapper';
import type { WabaDetails } from '@/app/types/api';
```

- Always use the `@/` path alias instead of relative paths (`../`)
- Use `import type` for type-only imports
- Do not place `export const dynamic` or other config directives between import statements

### Comments

- Write comments that explain **why**, not **what**. The code should be readable enough to explain itself.
- Do not leave commented-out code in the codebase. Use version control to retrieve old code.
- Do not leave unresolved `// TODO` comments in merged code. If work is deferred, create an issue and reference it: `// TODO(#42): Add retry logic`.
- Remove boilerplate or template comments inherited from libraries.

### Copyright Headers

All source files (`.ts`, `.tsx`, `.mjs`, `.js`, `.css`) must include the MIT license header:

```typescript
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
```

---

## TypeScript

This is a TypeScript project. Use the type system to make the code self-documenting and catch bugs at compile time.

### General Rules

- **No `any`**. Use specific types, generics, or `unknown` (with narrowing) instead. If a type is genuinely dynamic, define a union or use a type guard.
- **Type all function parameters and return values** for exported functions and API handlers.
- **Type all component props** using an interface or type alias:

```typescript
// Good
interface SendMessageProps {
  phoneNumberId: string;
  accessToken: string;
  onSend: (message: string) => Promise<void>;
}

function SendMessage({ phoneNumberId, accessToken, onSend }: SendMessageProps) {
  // ...
}

// Bad
function SendMessage({ phoneNumberId, accessToken, onSend }) {
  // ...
}
```

- **Use shared types** from `app/types/api.ts`. Do not redefine types locally in page components when the type already exists in the shared file.
- **Do not suppress TypeScript** with `// @ts-ignore` or `// @ts-expect-error` without a justifying comment.

### tsconfig.json

The project should move toward `"strict": true`. At minimum, enable:

- `noImplicitAny: true`
- `strictNullChecks: true`
- `noImplicitReturns: true`

### Build Errors

TypeScript errors must not be ignored. Do not rely on `ignoreBuildErrors: true` in `next.config.mjs` to ship code with type errors. All code must pass `npm run type-check` before merging.

---

## React and Next.js Patterns

### Server vs Client Components

- **Default to Server Components.** Only add `'use client'` when the component needs browser APIs, event handlers, `useState`, or `useEffect`.
- **Mark server-only code explicitly** with `'use server'` to prevent accidental client bundling of secrets or database logic.
- Do not import server-only modules (database clients, private config) in client components.

### Component Structure

```typescript
// 1. Copyright header
// 2. 'use client' directive (if needed)
// 3. Imports
// 4. Types/interfaces
// 5. Component function
// 6. Helper functions (keep below the component or extract to a utility file)
// 7. Default export
```

### Styling

- Use Tailwind CSS utility classes for all styling
- For conditional classes, use a utility like `clsx` or `cn` instead of template literal string concatenation
- Extract repeated class combinations into Tailwind `@apply` directives in `globals.css` or a component-level CSS module if they appear in 3+ places
- Keep class strings readable. If a class string exceeds ~120 characters, break it across multiple lines

---

## API Routes

### Structure

All authenticated API routes must use the `withAuth()` wrapper:

```typescript
import { withAuth } from '@/app/api/authWrapper';

export const POST = withAuth(async function handleSend(request, session) {
  // 1. Parse and validate input
  // 2. Business logic
  // 3. Return a typed response
});
```

### Response Format

Use `NextResponse.json()` consistently (not `new NextResponse(JSON.stringify(...))`):

```typescript
// Good
return NextResponse.json({ data: result }, { status: 200 });
return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

// Bad
return new NextResponse(JSON.stringify({ data: result }), { status: 200 });
return new NextResponse('{"status":"ok"}');
```

### Input Validation

Validate all request body parameters before using them. Return a `400` with a descriptive message for invalid input:

```typescript
const { phoneNumberId, message } = await request.json();

if (!phoneNumberId || typeof phoneNumberId !== 'string') {
  return NextResponse.json(
    { error: 'Missing or invalid phoneNumberId' },
    { status: 400 }
  );
}
```

### Handler Naming

Give route handlers descriptive names (not `myApiRoute`):

```typescript
// Good
export const POST = withAuth(async function sendMessage(request, session) { ... });

// Bad
export const POST = withAuth(async function myApiRoute(request, session) { ... });
```

### Environment Variables

- Access environment variables through the config modules (`publicConfig` and `privateConfig`), not directly via `process.env`.
- `publicConfig` is for values safe to expose to the client (app ID, API version).
- `privateConfig` is for secrets (app secret, webhook verify token). It is marked `'use server'` and must never be imported in client components.

---

## Error Handling

Every API route and async operation must have proper error handling. Silent failures make debugging impossible for developers using this as a reference.

### API Routes

Wrap the handler body in try/catch and return structured error responses:

```typescript
export const POST = withAuth(async function handleRegister(request, session) {
  try {
    const body = await request.json();
    // ... business logic ...
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to register phone number:', error);
    return NextResponse.json(
      { error: 'Failed to register phone number' },
      { status: 500 }
    );
  }
});
```

### Graph API Calls

Always check for error responses from the Meta Graph API:

```typescript
const data = await graphApiWrapperGet(url, accessToken);
if (data.error) {
  throw new Error(`Graph API error: ${data.error.message} (code: ${data.error.code})`);
}
```

### Client Components

Use Error Boundaries for component-level error recovery. Do not let errors silently fail or render blank screens.

### Rules

- Never swallow errors with an empty `.catch(() => {})` or `.catch(err => console.error(err))` that discards the result.
- Never use `throw` inside a `.then()` chain without a corresponding `.catch()`. Prefer async/await for readability.
- Surface errors to the user with meaningful messages. "Something went wrong" is not meaningful.

---

## Security

This app handles OAuth tokens and communicates with the Meta Graph API. Security mistakes in a reference app get replicated across the ecosystem. Treat every security concern seriously.

### Secrets and Tokens

- **Never log access tokens, app secrets, or other credentials.** Not to `console.log`, not to structured logs, not anywhere. Log identifiers (WABA ID, phone ID) and outcomes (success/failure) instead.
- **Never pass access tokens in URL query strings.** Use the `Authorization: Bearer` header via `graphApiWrapperGet`/`graphApiWrapperPost`. Tokens in URLs appear in server logs, browser history, and proxy caches.
- **Never expose tokens in the client UI.** Do not render access tokens on the page, even truncated, and do not link to external tools with tokens in the URL.
- Keep secrets in `privateConfig` (marked `'use server'`). Never import `privateConfig` in client components.

### Webhook Verification

The webhook POST handler must verify the `X-Hub-Signature-256` header to confirm that requests originate from Meta:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string, appSecret: string): boolean {
  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

Reject requests with missing or invalid signatures with a `403` response.

### Data Access Scoping

All database queries that retrieve user-specific data (tokens, WABAs, pages, etc.) must include a `WHERE user_id = ...` clause. Never allow one authenticated user to access another user's data by guessing resource IDs.

### Input Validation

- Validate and sanitize all user input on the server side before using it in API calls or database queries.
- Use parameterized SQL queries (the `sql` template tag from `@vercel/postgres` handles this) — never concatenate user input into query strings.

### Dependency Security

- Keep dependencies up to date. Run `npm audit` regularly and address critical/high vulnerabilities promptly.
- Pin exact dependency versions in `package.json` (not ranges) for reproducible builds.

---

## Logging

Logging should help operators diagnose production issues without leaking sensitive data.

### Rules

- **Never log credentials.** No access tokens, app secrets, session objects, or API keys in log output.
- Log **what happened** (action, resource ID, outcome) not **raw data** (full request bodies, full API responses).
- Use `console.error` for errors and `console.log` for informational messages. Consider adopting a structured logging library (like `pino`) as the project matures.
- Remove debug-quality log statements (`console.log('page!*!', data)`) before merging.

### Example

```typescript
// Good
console.log(`Registered phone ${phoneId} for WABA ${wabaId}`);
console.error(`Failed to register phone ${phoneId}:`, error.message);

// Bad
console.log('registerNumber:', 'phoneId', phoneId, 'accessToken', accessToken);
console.log(session);
```

---

## Testing

Every new feature or bug fix should include tests. As the test infrastructure is set up:

- Write unit tests for utility functions (`beUtils.ts`, `errorFormat.ts`, config modules)
- Write integration tests for API routes (verify correct responses for valid input, invalid input, and auth failures)
- Write component tests for interactive components (form submissions, error states)
- Use `npm run lint:all` as the minimum bar — all code must pass ESLint and TypeScript checks

---

## Submitting Changes

### Diff Guidelines

- **One logical change per diff.** Do not mix feature work with unrelated refactoring.
- **Keep diffs small and reviewable.** If a change touches more than ~10 files, consider splitting it.
- **Write a clear summary** explaining the motivation, not just what changed.
- **Include a test plan** with specific steps to verify the change works.

### Before Submitting

Run the full check suite:

```bash
npm run lint:all    # ESLint + TypeScript type-check
npm run build       # Verify production build succeeds
npm run dev         # Smoke test locally at localhost:3000
```

### Code Review Checklist

- [ ] TypeScript: No `any` types introduced. All new props and function signatures are typed.
- [ ] Error handling: All API calls and async operations have try/catch. Errors surface to the user.
- [ ] Security: No tokens logged or exposed in the UI. Webhook requests are verified. DB queries are user-scoped.
- [ ] Naming: Consistent with project conventions (camelCase variables, PascalCase components).
- [ ] Imports: Uses `@/` path alias. `import type` for type-only imports. Organized in standard order.
- [ ] Comments: No commented-out code. No unresolved TODOs without issue references.
- [ ] Copyright: MIT header present on all new source files.
- [ ] Lint: `npm run lint:all` passes with no warnings or errors.
