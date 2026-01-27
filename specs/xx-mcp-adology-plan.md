# Integration Plan: Noted Staging + Adology Dev2 MCP

## Credentials

```bash
# Add to your .env.local
NEXT_PUBLIC_ADOLOGY_CLIENT_ID=...
ADOLOGY_CLIENT_SECRET=...
NEXT_PUBLIC_ADOLOGY_AUTH_URL=...
NEXT_PUBLIC_ADOLOGY_REDIRECT_URI=...
ADOLOGY_MCP_URL=https://mcp.dev2.getadology.ai/mcp
ADOLOGY_TOKEN_URL=https://test.stytch.com/v1/public/<project-id>/oauth2/token
```

**Registered Redirect URLs:**
- `https://stag.wellnoted.dev/api/auth/callback/adology`
- `http://localhost:3001/api/auth/callback/adology`

---

## Implementation

### 1. Install Dependencies
```bash
npm install @ai-sdk/mcp
```

### 2. Client & OAuth Implementation

We implemented a custom OAuth + MCP client flow rather than using the raw SDK's auth provider to fit better with the Next.js App Router and Clerk authentication context.

**Key Components:**
- **`lib/adology-mcp.ts`**: MCP Client factory & OAuth PKCE utilities.
- **`app/api/auth/callback/adology/route.ts`**: Handles code exchange and stores tokens in Convex.
- **`convex/coworkerAdology.ts`**: Persists tokens securely associated with the user's workspace config.
- **`AdologyMCPMenuItem.tsx`**: UI to initiate the OAuth flow.

### 3. Agent Integration

Adology tools are injected dynamically into the Coworker agent's toolset in `app/api/ai/coworker/route.ts`.

## Troubleshooting & Schema Sanitization

**Critical Issue: Gemini API & Boolean Enums**

The Google Gemini API has strict JSON schema validation that rejects schema definitions containing boolean values within `enum` arrays or `const` properties, even though these are valid in standard JSON Schema (Draft 7+).

**Error Message:**
> `Invalid value at 'tools[0]...enum[0]' (TYPE_STRING), true`

**Solution: Client-side Schema Sanitization**
We implemented a recursive `sanitizeSchema` function in `app/api/ai/coworker/route.ts` that pre-processes Adology MCP tools before sending them to Gemini.

**Fix Logic:**
1. **Boolean Enums**: Recursive traversal finds any `enum` array containing boolean values (e.g., `[true, false]`) and converts them to strings (`["true", "false"]`). It also forces the property's `type` to `string`.
2. **Boolean Consts**: Detects properties with `const: true` or `const: false` (common in `oneOf` discriminators) and converts them to `const: "true"` / `type: "string"`.

**Code Snippet:**
```typescript
function sanitizeSchema(schema: any): any {
    // ... traversal logic ...
    
    // Fix enum values
    if (newSchema.enum && newSchema.enum.some(v => typeof v === 'boolean')) {
        newSchema.enum = newSchema.enum.map(v => String(v));
        newSchema.type = 'string';
    }

    // Fix const values
    if (typeof newSchema.const === 'boolean') {
        newSchema.const = String(newSchema.const);
        newSchema.type = 'string';
    }
    
    // ... recursive calls ...
}
```

---

## Verification Steps
1. Set env vars in Noted (`.env.local`).
2. Navigate to "Edit Marketing Persona".
3. Toggle "Adology MCP" **ON**.
4. Authenticate via Stytch B2B flow.
5. In chat, ask: "Update my Knowledge Set description".
6. **Pass Condition**: The agent correctly receives the tool schema and can invoke `updateKnowledgeSet` without a 400 Bad Request error.
