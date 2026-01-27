import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, LanguageModel, stepCountIs } from "ai";
import { NextRequest } from "next/server";
import { createWorkspaceTools } from "@/lib/agent/tools/workspace";
import { buildSystemPrompt } from "@/lib/agent/prompts/marketing-persona";
import { Id } from "@/convex/_generated/dataModel";

// Allow streaming responses up to 60 seconds (agent may take longer)
export const maxDuration = 60;

// Message type for API
interface ChatMessage {
    role: "user" | "assistant";
    content?: string;
    parts?: any[];
}

// Block type from BlockNote
interface Block {
    type: string;
    content?: string | any[];
    children?: Block[];
}

/**
 * Sanitize tool definitions for Google Gemini
 * Gemini has strict requirements on JSON schemas, specifically checking for boolean enums
 */
function sanitizeSchema(schema: any): any {
    if (!schema) return schema;
    if (typeof schema === 'function') return schema; // Skip functions
    if (typeof schema !== 'object') return schema; // Skip primitives

    // Deep clone if it's an array
    if (Array.isArray(schema)) {
        return schema.map(item => sanitizeSchema(item));
    }

    // Deep clone object
    const newSchema = { ...schema };

    // Fix enum values if they are not strings
    // Fix enum values if they are not strings
    if (newSchema.enum && Array.isArray(newSchema.enum)) {
        // If enum contains booleans, convert to string
        if (newSchema.enum.some((v: any) => typeof v === 'boolean')) {
            newSchema.enum = newSchema.enum.map((v: any) => String(v));
            newSchema.type = 'string'; // Force type to string if enum used
        }
    }

    // Fix const values if they are booleans (Gemini treats const as enum)
    if (newSchema.const !== undefined && typeof newSchema.const === 'boolean') {
        newSchema.const = String(newSchema.const);
        newSchema.type = 'string';
    }

    // Recursively handle ALL properties in the object
    for (const key in newSchema) {
        if (key !== 'enum' && key !== 'const') {
            newSchema[key] = sanitizeSchema(newSchema[key]);
        }
    }

    return newSchema;
}

/**
 * Create the appropriate AI model based on provider
 * For Google Gemini 2.5+ models, this includes thinkingConfig with includeThoughts
 */
function createAIModel(provider: string, apiKey: string, modelId: string): LanguageModel {
    switch (provider) {
        case "google": {
            const google = createGoogleGenerativeAI({ apiKey });
            // Use the model selected by the user in settings
            return google(modelId) as unknown as LanguageModel;
        }
        case "openai": {
            const openai = createOpenAI({ apiKey });
            return openai(modelId) as unknown as LanguageModel;
        }
        case "anthropic": {
            const anthropic = createAnthropic({ apiKey });
            return anthropic(modelId) as unknown as LanguageModel;
        }
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Get thinkingConfig provider options for Google Gemini models
 * Gemini 3 uses thinkingLevel, Gemini 2.5 uses thinkingBudget
 */
function getGoogleThinkingConfig(modelId: string): Record<string, any> | undefined {
    if (modelId.startsWith("gemini-3")) {
        return {
            google: {
                thinkingConfig: {
                    thinkingLevel: "high",
                    includeThoughts: true,
                },
            },
        };
    } else if (modelId.startsWith("gemini-2.5")) {
        return {
            google: {
                thinkingConfig: {
                    thinkingBudget: 8192,
                    includeThoughts: true,
                },
            },
        };
    }
    return undefined;
}

/**
 * Extract plain text from BlockNote content
 */
function extractTextFromBlocks(content: string): string {
    try {
        const blocks: Block[] = JSON.parse(content);
        let text = "";

        const processBlock = (block: Block) => {
            // Handle text content which can be string or array of styled text objects
            if (Array.isArray(block.content)) {
                block.content.forEach((item) => {
                    if (typeof item === "string") text += item;
                    else if (item.text) text += item.text;
                });
            } else if (typeof block.content === "string") {
                text += block.content;
            }

            text += "\n";

            if (block.children) {
                block.children.forEach(processBlock);
            }
        };

        blocks.forEach(processBlock);
        return text;
    } catch (e) {
        console.error("Failed to parse document content:", e);
        return "";
    }
}

/**
 * Marketing Co-worker Agent API Route
 * 
 * Provides a chat interface with the agent that has access to workspace tools
 */
import { auth } from "@clerk/nextjs/server";

// ... existing imports ...

export async function POST(req: NextRequest) {
    try {
        // Verify authentication using Clerk (works with cookies)
        const { userId, getToken } = await auth();

        if (!userId) {
            return Response.json({ error: "Not authenticated" }, { status: 401 });
        }

        const token = await getToken({ template: "convex" });
        if (!token) {
            return Response.json({ error: "Failed to retrieve authentication token" }, { status: 401 });
        }

        // Parse request
        const requestBody = await req.json();
        const { messages } = requestBody;

        if (!Array.isArray(messages)) {
            return Response.json({ error: "Messages array is required" }, { status: 400 });
        }

        // Initialize Convex client with auth
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        convex.setAuth(token);

        // Get coworker configuration
        const config = await convex.query(api.coworkerConfig.getConfig, {});

        // Coworker requires an instruction document
        if (!config?.instructionsDocId) {
            return Response.json(
                { error: "No instruction document configured. Please set up your coworker first." },
                { status: 400 }
            );
        }

        // Get the instruction document content
        let systemPrompt = "";
        try {
            const doc = await convex.query(api.documents.getById, {
                documentId: config.instructionsDocId as Id<"documents">
            });

            if (doc?.content) {
                const docText = extractTextFromBlocks(doc.content);
                if (docText.trim()) {
                    // Simple: instruction content + tool calling instructions
                    systemPrompt = buildSystemPrompt(docText);
                }
            }
        } catch (e) {
            console.warn("Failed to load instructions document:", e);
        }

        if (!systemPrompt) {
            return Response.json(
                { error: "Instruction document is empty. Please add content to your coworker's instruction page." },
                { status: 400 }
            );
        }

        // Get API key from existing BYOK settings
        const settings = await convex.action(
            (api as any).aiSettingsActions.getDecryptedApiKey,
            {}
        );

        if (!settings?.apiKey) {
            return Response.json(
                { error: "AI settings not configured. Please add an API key in Settings." },
                { status: 400 }
            );
        }

        // Get model ID for thinkingConfig lookup
        const modelId = settings.model || "gemini-2.5-flash";

        // Create the AI model
        const model = createAIModel(
            settings.provider,
            settings.apiKey,
            modelId
        );

        // Get provider options for thinking (Google models)
        const providerOptions = settings.provider === "google"
            ? getGoogleThinkingConfig(modelId)
            : undefined;

        // Create workspace tools with execute functions
        const tools = createWorkspaceTools(convex, config?.instructionsDocId);

        // Inject Adology MCP tools if enabled
        if (config?.adologyEnabled && config?.adologyTokens?.accessToken) {
            try {
                // Determine token expiration (optional safety check)
                const now = Date.now();
                // Check if expired or expiring in 5 minutes
                const expiresAt = config.adologyTokens?.expiresAt || 0;

                if (now > (expiresAt - 5 * 60 * 1000) && config.adologyTokens.refreshToken) {
                    console.log("Adology token expiring, refreshing...");
                    try {
                        const { refreshAdologyTokens } = await import("@/lib/adology-mcp");
                        const newTokens = await refreshAdologyTokens(config.adologyTokens.refreshToken);

                        // Save new tokens to Convex
                        if (newTokens.access_token) {
                            await convex.mutation((api as any).coworkerAdology.saveAdologyTokens, {
                                accessToken: newTokens.access_token,
                                refreshToken: newTokens.refresh_token || config.adologyTokens.refreshToken, // Keep old refresh token if not rotated
                                expiresIn: newTokens.expires_in
                            });

                            // Use the new token for this request
                            config.adologyTokens.accessToken = newTokens.access_token;
                            console.log("Adology token refreshed successfully");
                        }
                    } catch (e) {
                        console.error("Failed to refresh Adology tokens:", e);
                        // Fallback: Try with existing token or let it fail downstream
                    }
                }

                // If token is expired and we had a refresh token, we would refresh here
                // For now, we'll try to use it and if it fails, the agent will just strictly use workspace tools

                const { getAdologyMcpClient } = await import("@/lib/adology-mcp");
                const adologyClient = await getAdologyMcpClient(config.adologyTokens.accessToken);

                const mcpTools = await adologyClient.tools();
                const firstToolName = Object.keys(mcpTools)[0];
                const firstTool = Object.values(mcpTools)[0] as any;
                console.error("DEBUG: Raw MCP Tool (full):", JSON.stringify(firstTool, null, 2));


                // Sanitize tools for Gemini (fix boolean enums, etc)
                const sanitizedMcpTools: Record<string, any> = {};
                for (const [name, tool] of Object.entries(mcpTools)) {
                    sanitizedMcpTools[name] = sanitizeSchema(tool);
                }

                // Merge tools
                Object.assign(tools, sanitizedMcpTools);
            } catch (err) {
                console.error("Failed to load Adology tools:", err);
                // We continue without Adology tools rather than failing the request
            }
        }

        // Convert messages to the format expected by streamText (AI SDK Core)
        const formattedMessages = messages.map((msg: ChatMessage) => {
            // Handle parts based content (SDK v6 standard) or string content
            // If parts exist, use them. If strictly string, use content.
            if (msg.parts && Array.isArray(msg.parts)) {
                return {
                    role: msg.role as "user" | "assistant",
                    content: msg.parts.map(part => {
                        // Ensure each part is strictly typed for CoreMessage
                        if (part.type === 'text') return { type: 'text', text: part.text };
                        if (part.type === 'image') return { type: 'image', image: part.image };
                        // Support generic file parts. validation requires mediaType in some versions.
                        if (part.type === 'file') return {
                            type: 'file',
                            data: part.data,
                            mimeType: part.mimeType,
                            mediaType: part.mimeType
                        };
                        // Filter out reasoning/unknown parts for the input to the model to avoid Zod errors
                        return null;
                    }).filter(Boolean) as any
                };
            }

            return {
                role: msg.role as "user" | "assistant",
                content: msg.content || "",
            };
        });

        // Stream response with tools and thinking config
        const result = streamText({
            model,
            system: systemPrompt,
            messages: formattedMessages,
            tools: tools as any, // Type assertion needed due to complex tool typing
            stopWhen: stepCountIs(5), // Enable multi-step agentic behavior (tool call -> result -> response)
            ...(providerOptions && { providerOptions }), // Include thinking config for Google
        });

        // Use toUIMessageStreamResponse to support Data Stream protocol (tools, etc)
        // usage of toDataStreamResponse caused runtime error, reverting to alias
        // @ts-ignore
        return result.toUIMessageStreamResponse({
            sendReasoning: true
        });
    } catch (error) {
        console.error("Coworker API error:", error);
        return Response.json(
            { error: "Failed to process coworker request" },
            { status: 500 }
        );
    }
}
