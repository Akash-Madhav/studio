
"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, Rss } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { getPosts, createPost, getGroupMessages, sendGroupMessage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { sampleUsers } from "@/lib/sample-data";

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

interface GroupMessage {
    _id: string;
    senderId: string;
    authorName: string;
    authorAvatar: string;
    role: 'player' | 'coach';
    text: string;
    createdAt: Date;
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
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    
    const [isFetching, setIsFetching] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const postForm = useForm<z.infer<typeof postFormSchema>>({
        resolver: zodResolver(postFormSchema),
        defaultValues: { content: "" },
    });

    useEffect(() => {
        async function fetchData() {
            setIsFetching(true);
            try {
                const [postRes, messageRes] = await Promise.all([
                    getPosts(role),
                    getGroupMessages(role)
                ]);

                if (postRes.success) setPosts(postRes.posts as Post[]);
                if (messageRes.success) setMessages(messageRes.messages as GroupMessage[]);

            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to load community data." });
            } finally {
                setIsFetching(false);
            }
        }
        fetchData();
    }, [role, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        const result = await sendGroupMessage({ senderId: userId, role, text: newMessage });
        if (result.success && result.message) {
            setMessages(prev => [...prev, result.message as GroupMessage]);
            setNewMessage("");
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to send message." });
        }
        setIsSending(false);
    };

    if (isFetching) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
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
                                <Avatar>
                                    <AvatarImage src={post.authorAvatar} data-ai-hint="person face" />
                                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{post.authorName}</p>
                                    <p className="text-sm text-muted-foreground">{dayjs(post.createdAt).fromNow()}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{post.content}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-1">
                <Card className="flex flex-col h-[calc(100vh-250px)]">
                    <CardHeader>
                        <CardTitle>{role === 'player' ? "Player" : "Coach"} Group Chat</CardTitle>
                        <CardDescription>Chat with your peers.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-4 pr-4">
                        {messages.map(msg => (
                            <div key={msg._id} className={`flex items-start gap-3 ${msg.senderId === userId ? 'justify-end' : ''}`}>
                                {msg.senderId !== userId && 
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={msg.authorAvatar} data-ai-hint="person face"/>
                                        <AvatarFallback>{msg.authorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                }
                                <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {msg.senderId !== userId && <p className="text-xs font-bold mb-1">{msg.authorName}</p>}
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                disabled={isSending}
                            />
                            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                                {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
