import { createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Create an MCP client connected to the Adology server
 * uses @ai-sdk/mcp to bridge the MCP tools to AI SDK format
 */
export async function getAdologyMcpClient(accessToken: string) {
    if (!process.env.ADOLOGY_MCP_URL) {
        throw new Error("ADOLOGY_MCP_URL is not defined");
    }

    return await createMCPClient({
        transport: new StreamableHTTPClientTransport(
            new URL(process.env.ADOLOGY_MCP_URL),
            {
                requestInit: {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            }
        )
    });
}

/**
 * Generate a random string for PKCE verifier
 */
function generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }
    return result;
}

/**
 * Generate code challenge from verifier (S256)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Build Adology OAuth Authorization URL with PKCE
 */
export async function buildAuthUrl(): Promise<{ url: string; verifier: string }> {
    const clientId = process.env.NEXT_PUBLIC_ADOLOGY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_ADOLOGY_REDIRECT_URI;
    const authUrl = process.env.NEXT_PUBLIC_ADOLOGY_AUTH_URL;

    if (!clientId || !redirectUri || !authUrl) {
        throw new Error("Missing Adology OAuth environment variables");
    }

    const verifier = generateRandomString(128);
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString(32);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state,
        scope: 'offline_access openid profile', // adjust scopes as needed
    });

    return {
        url: `${authUrl}?${params.toString()}`,
        verifier
    };
}

/**
 * Exchange auth code for tokens
 */
export async function exchangeCodeForTokens(code: string, verifier: string) {
    const clientId = process.env.NEXT_PUBLIC_ADOLOGY_CLIENT_ID;
    const clientSecret = process.env.ADOLOGY_CLIENT_SECRET; // Server-side only
    const redirectUri = process.env.NEXT_PUBLIC_ADOLOGY_REDIRECT_URI;
    // Default to api.dev2, but allow override. 
    // dash.dev2 is the frontend, api.dev2 is likely the backend.
    const tokenUrl = process.env.ADOLOGY_TOKEN_URL || 'https://api.dev2.getadology.ai/oauth/token';

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Missing Adology OAuth environment variables");
    }

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            code_verifier: verifier,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to exchange token: ${errorText}`);
    }

    return await response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAdologyTokens(refreshToken: string) {
    const clientId = process.env.NEXT_PUBLIC_ADOLOGY_CLIENT_ID;
    const clientSecret = process.env.ADOLOGY_CLIENT_SECRET;
    // Default to api.dev2, but allow override.
    const tokenUrl = process.env.ADOLOGY_TOKEN_URL || 'https://api.dev2.getadology.ai/oauth/token';

    if (!clientId || !clientSecret) {
        throw new Error("Missing Adology OAuth environment variables");
    }

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${errorText}`);
    }

    return await response.json();
}
