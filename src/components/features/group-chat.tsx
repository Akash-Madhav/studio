
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendGroupMessage } from "@/app/actions";
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUser } from "@/app/actions";

interface GroupMessage {
    _id: string;
    senderId: string;
    authorName: string;
    authorAvatar: string;
    role: 'player' | 'coach';
    text: string;
    createdAt: Date;
}

interface GroupChatProps {
    userId: string;
    role: 'player' | 'coach';
}

export default function GroupChat({ userId, role }: GroupChatProps) {
    const { toast } = useToast();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isFetching, setIsFetching] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'groupChats'),
            where('role', '==', role),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const messagesData = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const userRes = await getUser(data.senderId);
                const createdAt = data.createdAt as Timestamp;
                return {
                    _id: doc.id,
                    ...data,
                    authorName: userRes.user?.name || 'Unknown',
                    authorAvatar: `https://picsum.photos/seed/${data.senderId}/50/50`,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                } as GroupMessage;
            }));
            setMessages(messagesData);
            setIsFetching(false);
        }, (error) => {
            console.error("Error fetching group messages:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to load group chat." });
            setIsFetching(false);
        });
        
        return () => unsubscribe();
    }, [role, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        const result = await sendGroupMessage({ senderId: userId, role, text: newMessage });
        if (result.success && result.message) {
            // Firestore listener will auto-update the UI
            setNewMessage("");
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to send message." });
        }
        setIsSending(false);
    };

    if (isFetching) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <>
            <ScrollArea className="flex-grow p-6">
                <div className="space-y-4 pr-4">
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
                </div>
            </ScrollArea>
            <div className="p-6 pt-4 border-t bg-background">
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
            </div>
        </>
    );
}
