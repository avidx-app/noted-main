"use client";

import { useShareModal } from "@/hooks/use-share-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, Globe, X } from "lucide-react";
import { toast } from "sonner";
import { useOrigin } from "@/hooks/useOrigin";
import { useUser } from "@clerk/clerk-react";
import { Doc, Id } from "@/convex/_generated/dataModel";

export const ShareModal = () => {
    const shareModal = useShareModal();
    const { user } = useUser();
    const origin = useOrigin();

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("can_view");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Use skip if no documentId to prevent errors
    const document = useQuery(api.documents.getById,
        shareModal.documentId ? { documentId: shareModal.documentId } : "skip"
    );

    const shares = useQuery(api.pageShares.getPageShares,
        shareModal.documentId ? { documentId: shareModal.documentId } : "skip"
    );

    const updateDocument = useMutation(api.documents.update);
    // Replaced direct mutation with Clerk Action
    const inviteUser = useAction(api.clerk.inviteUser);
    const updateShareRole = useMutation(api.pageShares.updateShareRole);
    const removeShare = useMutation(api.pageShares.removeShare);

    const url = `${origin}/preview/${shareModal.documentId}`;

    const onInvite = async () => {
        if (!shareModal.documentId || !email) return;
        setIsSubmitting(true);

        try {
            await inviteUser({
                documentId: shareModal.documentId,
                email: email,
                role: role,
            });
            setEmail("");
            toast.success("Invitation sent");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send invitation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onUpdateRole = (shareId: Id<"pageShares">, newRole: string) => {
        const promise = updateShareRole({ id: shareId, role: newRole });
        toast.promise(promise, {
            loading: "Updating access...",
            success: "Access updated",
            error: "Failed to update access"
        });
    };

    const onRemoveShare = (shareId: Id<"pageShares">) => {
        const promise = removeShare({ id: shareId });
        toast.promise(promise, {
            loading: "Removing access...",
            success: "Access removed",
            error: "Failed to remove access"
        });
    };

    const onCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
        toast.success("Link copied");
    };

    const onPublish = () => {
        if (!shareModal.documentId) return;
        setIsSubmitting(true);

        const promise = updateDocument({
            id: shareModal.documentId,
            isPublished: true,
        }).finally(() => setIsSubmitting(false));

        toast.promise(promise, {
            loading: "Publishing...",
            success: "Note published!",
            error: "Failed to publish note.",
        });
    };

    const onUnpublish = () => {
        if (!shareModal.documentId) return;
        setIsSubmitting(true);

        const promise = updateDocument({
            id: shareModal.documentId,
            isPublished: false,
        }).finally(() => setIsSubmitting(false));

        toast.promise(promise, {
            loading: "Unpublishing...",
            success: "Note unpublished",
            error: "Failed to unpublish note.",
        });
    };

    if (!document) {
        return null;
    }

    return (
        <Dialog open={shareModal.isOpen} onOpenChange={shareModal.onClose}>
            <DialogContent className="sm:max-w-[550px] p-0">
                <Tabs defaultValue="share" className="w-full">
                    <div className="border-b px-6 py-4">
                        <TabsList className="grid w-[200px] grid-cols-2">
                            <TabsTrigger value="share">Share</TabsTrigger>
                            <TabsTrigger value="publish">Publish</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="share" className="p-6 pt-2 m-0 min-h-[300px]">
                        <div className="space-y-6">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100000]">
                                        <SelectItem value="can_edit">Can edit</SelectItem>
                                        <SelectItem value="can_view">Can view</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={onInvite} disabled={!email || isSubmitting}>
                                    Invite
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-x-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user?.imageUrl} />
                                            <AvatarFallback>Me</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {user?.fullName || "Me"} (You)
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {user?.primaryEmailAddress?.emailAddress}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground mr-2">Full access</span>
                                </div>

                                {shares?.map((share) => (
                                    <div key={share._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-x-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{share.email?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {share.email?.split("@")[0] || "User"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {share.email}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-x-1">
                                            <Select
                                                value={share.role}
                                                onValueChange={(val: string) => onUpdateRole(share._id, val)}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 border-none shadow-none focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[100000]">
                                                    <SelectItem value="can_edit">Can edit</SelectItem>
                                                    <SelectItem value="can_view">Can view</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                onClick={() => onRemoveShare(share._id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => onCopy(url)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy link
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="publish" className="m-0 p-0 text-center">
                        {document.isPublished ? (
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-center gap-x-2 text-sky-500 mb-4">
                                    <Globe className="h-4 w-4 animate-pulse" />
                                    <span className="text-sm font-medium">This page is live on the web.</span>
                                </div>

                                <div className="flex items-center gap-x-2">
                                    <Input value={url} readOnly className="h-8 bg-muted" />
                                    <Button onClick={() => onCopy(url)} size="sm" variant="ghost" className="h-8 px-2">
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onUnpublish}
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    Unpublish
                                </Button>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-medium text-lg">Publish to web</h3>
                                    <p className="text-sm text-muted-foreground">Create a website with Noted</p>
                                </div>

                                {/* Browser Frame Preview */}
                                <div className="mx-auto w-3/4 bg-background border rounded-lg shadow-sm overflow-hidden text-left">
                                    <div className="h-6 bg-muted border-b flex items-center px-2 gap-x-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                        <div className="flex-1 ml-2 bg-background h-4 rounded text-[8px] flex items-center px-2 text-muted-foreground overflow-hidden">
                                            {document.title}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-[#1F1F1F] min-h-[120px]">
                                        <h1 className="text-xl font-bold mb-2">{document.title || "Untitled"}</h1>
                                        <div className="h-2 w-2/3 bg-muted rounded mb-2" />
                                        <div className="h-2 w-full bg-muted rounded mb-2" />
                                        <div className="h-2 w-1/2 bg-muted rounded" />

                                        <div className="mt-6 flex justify-center">
                                            <div className="inline-flex items-center gap-x-1 bg-muted px-2 py-1 rounded text-[10px] text-muted-foreground">
                                                <span>Made with 📝 Noted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                                    onClick={onPublish}
                                    disabled={isSubmitting}
                                >
                                    Publish
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
