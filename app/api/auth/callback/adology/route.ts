import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { exchangeCodeForTokens } from "@/lib/adology-mcp";
import { Id } from "@/convex/_generated/dataModel";

import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/?error=' + error, req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?error=missing_code', req.url));
    }

    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            console.error("No auth token found in callback");
            return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
        }

        // 1. Get the current user's config to find the stored verifier
        const verifier = await fetchMutation(api.coworkerAdology.getCodeVerifier, {}, { token });

        if (!verifier) {
            console.error("No code verifier found for user");
            return NextResponse.redirect(new URL('/?error=no_verifier', req.url));
        }

        // 2. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, verifier);

        // 3. Store tokens in Convex
        await fetchMutation(api.coworkerAdology.saveAdologyTokens, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
        }, { token });

        // 4. Redirect back to the instruction page
        // We need to fetch the config again to get the document ID
        // Or we could have stored it in state, but looking it up is safer
        const config = await fetchQuery(api.coworkerConfig.getConfig, {}, { token });

        if (config?.instructionsDocId) {
            return NextResponse.redirect(new URL(`/documents/${config.instructionsDocId}?connected=adology`, req.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard?connected=adology', req.url));
        }

    } catch (err) {
        console.error("OAuth exchange failed:", err);
        return NextResponse.redirect(new URL('/?error=exchange_failed', req.url));
    }
}
