"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";
import { buildAuthUrl } from "@/lib/adology-mcp";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface AdologyMCPMenuItemProps {
    documentId: Id<"documents">;
}

export function AdologyMCPMenuItem({ documentId }: AdologyMCPMenuItemProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const config = useQuery(api.coworkerConfig.getConfig);
    const adologyStatus = useQuery(api.coworkerAdology.getAdologyStatus);
    const saveVerifier = useMutation(api.coworkerAdology.saveCodeVerifier);
    const clearTokens = useMutation(api.coworkerAdology.clearAdologyTokens);

    // Check for success/error params from callback
    useEffect(() => {
        const connected = searchParams.get("connected");
        const error = searchParams.get("error");

        if (connected === "adology") {
            toast.success("Connected to Adology MCP");
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete("connected");
            window.history.replaceState({}, "", url.toString());
        }

        if (error) {
            toast.error(`Adology connection failed: ${error}`);
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url.toString());
        }
    }, [searchParams]);

    // Only show for instruction documents
    if (config?.instructionsDocId !== documentId) return null;

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent menu from closing immediately if we want

        if (adologyStatus?.connected) {
            // Disconnect
            try {
                await clearTokens();
                toast.success("Disconnected from Adology MCP");
            } catch (err) {
                toast.error("Failed to disconnect");
                console.error(err);
            }
        } else {
            // Connect - Start OAuth Flow
            try {
                toast.loading("Connecting to Adology...");
                const { url, verifier } = await buildAuthUrl();

                // Save verifier for callback verification
                await saveVerifier({ verifier });

                // Redirect to Adology Auth
                window.location.href = url;
            } catch (err) {
                toast.error("Failed to start connection flow");
                console.error(err);
            }
        }
    };

    return (
        <DropdownMenuItem onClick={handleToggle} className="cursor-pointer">
            <Zap className="mr-2 h-4 w-4" />
            Adology MCP
            <div className="ml-auto pointer-events-none">
                <Switch
                    checked={adologyStatus?.connected ?? false}
                // The switch itself is not interactive, the menu item click handles it
                // This avoids double event handling issues
                />
            </div>
        </DropdownMenuItem>
    );
}
