
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Newspaper, MessageCircle, Rss } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { getPosts, createPost } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { sampleUsers } from "@/lib/sample-data";
import GroupChat from "./group-chat";

dayjs.extend(relativeTime);

interface Post {
    _id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    role: 'player' | 'coach';
    content: string;
    createdAt: Date;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'player' | 'coach';
    dob?: Date;
    experience?: string;
    goals?: string;
    status?: string;
}

interface CommunityHubProps {
    userId: string;
    role: 'player' | 'coach';
}

const postFormSchema = z.object({
    content: z.string().min(1, "Post content cannot be empty.").max(280, "Post cannot exceed 280 characters."),
});

export default function CommunityHub({ userId, role }: CommunityHubProps) {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    
    const [isFetching, setIsFetching] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
    const postForm = useForm<z.infer<typeof postFormSchema>>({
        resolver: zodResolver(postFormSchema),
        defaultValues: { content: "" },
    });

    useEffect(() => {
        async function fetchData() {
            setIsFetching(true);
            try {
                const postRes = await getPosts(role);
                if (postRes.success) setPosts(postRes.posts as Post[]);
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to load community feed." });
            } finally {
                setIsFetching(false);
            }
        }
        fetchData();
    }, [role, toast]);

    const handleCreatePost = async (values: z.infer<typeof postFormSchema>) => {
        setIsPosting(true);
        const result = await createPost({ authorId: userId, role, content: values.content });
        if (result.success && result.post) {
            const author = sampleUsers.find(u => u.id === result.post!.authorId);
            const newPost = {
                ...result.post,
                authorName: author?.name || 'Unknown',
                authorAvatar: `https://picsum.photos/seed/${result.post.authorId}/50/50`,
            };
            setPosts(prev => [newPost as Post, ...prev]);
            postForm.reset();
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to create post." });
        }
        setIsPosting(false);
    };

    const handleUserClick = (authorId: string) => {
        const user = sampleUsers.find(u => u.id === authorId);
        if (user) {
            setSelectedUser(user as User);
        }
    };

    if (isFetching) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    const groupChatName = role === 'player' ? "Player's Lounge" : "Coaches' Corner";
    const groupChatDescription = role === 'player' ? "Chat with all other players." : "Discuss strategies with your fellow coaches.";

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
            <Tabs defaultValue="feed" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="feed">
                        <Newspaper className="mr-2"/>
                        Feed
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                        <MessageCircle className="mr-2"/>
                        Group Chat
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="feed" className="mt-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create a Post</CardTitle>
                            </CardHeader>
                            <form onSubmit={postForm.handleSubmit(handleCreatePost)}>
                                <CardContent>
                                    <Textarea
                                        {...postForm.register("content")}
                                        placeholder={`Share what's on your mind...`}
                                        className="min-h-[100px]"
                                        disabled={isPosting}
                                    />
                                    {postForm.formState.errors.content && (
                                        <p className="text-sm text-destructive mt-2">{postForm.formState.errors.content.message}</p>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button type="submit" disabled={isPosting}>
                                        {isPosting && <Loader2 className="animate-spin mr-2" />}
                                        Post
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><Rss /> {role === 'player' ? "Player" : "Coach"} Feed</h2>
                            {posts.map(post => (
                                <Card key={post._id}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <DialogTrigger asChild>
                                            <button onClick={() => handleUserClick(post.authorId)} className="flex items-center gap-4 text-left">
                                                <Avatar>
                                                    <AvatarImage src={post.authorAvatar} data-ai-hint="person face" />
                                                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold hover:underline">{post.authorName}</p>
                                                    <p className="text-sm text-muted-foreground">{dayjs(post.createdAt).fromNow()}</p>
                                                </div>
                                            </button>
                                        </DialogTrigger>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="whitespace-pre-wrap">{post.content}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="chat" className="mt-6">
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Group Chats</CardTitle>
                                <CardDescription>Join the conversation with your peers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <Dialog>
                                <DialogTrigger asChild>
                                        <div className="p-4 rounded-lg border flex items-center gap-4 cursor-pointer hover:bg-muted">
                                            <div className="bg-primary/10 text-primary p-3 rounded-full">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">{groupChatName}</p>
                                                <p className="text-muted-foreground">{groupChatDescription}</p>
                                            </div>
                                        </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl w-full h-[80vh] flex flex-col p-0">
                                    <DialogHeader className="p-6 pb-0">
                                        <DialogTitle>{groupChatName}</DialogTitle>
                                    </DialogHeader>
                                    <GroupChat userId={userId} role={role} />
                                </DialogContent>
                            </Dialog>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogContent>
                {selectedUser && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://picsum.photos/seed/${selectedUser.id}/100/100`} data-ai-hint="person face" />
                                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <DialogTitle className="text-2xl">{selectedUser.name}</DialogTitle>
                                    <DialogDescription className="capitalize">{selectedUser.role} &middot; {selectedUser.experience}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="py-4">
                            <h4 className="font-semibold text-primary mb-2">Fitness Goals</h4>
                            <p className="text-muted-foreground text-sm">{selectedUser.goals || "No goals set yet."}</p>
                        </div>
                    </>
                )}
            </DialogContent>

        </Dialog>
    );
}
