
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getConversations, getMessages, sendMessage, Conversation } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const FAKE_CURRENT_USER_ID = "coach1"; // This would come from an auth context

export default function Messages() {
    const searchParams = useSearchParams();
    const preselectedUserId = searchParams.get('userId');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        async function fetchConversations() {
            setIsLoading(true);
            const result = await getConversations(FAKE_CURRENT_USER_ID);
            if(result.success && result.conversations) {
                setConversations(result.conversations);
                if (preselectedUserId) {
                    const convo = result.conversations.find(c => c.participants.some(p => p.id === preselectedUserId));
                    if (convo) {
                        setSelectedConversation(convo);
                    }
                } else if (result.conversations.length > 0) {
                    setSelectedConversation(result.conversations[0]);
                }
            } else {
                toast({ variant: 'destructive', title: "Error", description: "Failed to fetch conversations." });
            }
            setIsLoading(false);
        }
        fetchConversations();
    }, [toast, preselectedUserId]);

    useEffect(() => {
        if (selectedConversation) {
            async function fetchMessages() {
                const result = await getMessages(selectedConversation.id);
                if (result.success && result.messages) {
                    setMessages(result.messages);
                } else {
                    toast({ variant: 'destructive', title: "Error", description: "Failed to fetch messages." });
                }
            }
            fetchMessages();

            // Setup real-time listener if you have one
        }
    }, [selectedConversation, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);
        const result = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: FAKE_CURRENT_USER_ID,
            text: newMessage,
        });

        if (result.success && result.message) {
            setMessages(prev => [...prev, result.message]);
            setNewMessage("");
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to send message." });
        }
        setIsSending(false);
    };

    const getOtherParticipant = (convo: Conversation) => {
        return convo.participants.find(p => p.id !== FAKE_CURRENT_USER_ID);
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            <Card className="col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin"/>
                        </div>
                    ) : (
                        <div className="space-y-2">
                           {conversations.map(convo => (
                                <div 
                                    key={convo.id}
                                    onClick={() => setSelectedConversation(convo)}
                                    className={`p-3 rounded-lg cursor-pointer ${selectedConversation?.id === convo.id ? 'bg-accent' : 'hover:bg-muted'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://picsum.photos/seed/${getOtherParticipant(convo)?.id}/50/50`} data-ai-hint="person face" />
                                            <AvatarFallback>{getOtherParticipant(convo)?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{getOtherParticipant(convo)?.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.text}</p>
                                        </div>
                                    </div>
                                </div>
                           ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 flex flex-col">
                {selectedConversation ? (
                    <>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${getOtherParticipant(selectedConversation)?.id}/50/50`} data-ai-hint="person face" />
                                    <AvatarFallback>{getOtherParticipant(selectedConversation)?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {getOtherParticipant(selectedConversation)?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === FAKE_CURRENT_USER_ID ? 'justify-end' : ''}`}>
                                    {msg.senderId !== FAKE_CURRENT_USER_ID && <Avatar className="h-8 w-8"><AvatarImage src={`https://picsum.photos/seed/${msg.senderId}/40/40`} data-ai-hint="person face"/></Avatar>}
                                    <div className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${msg.senderId === FAKE_CURRENT_USER_ID ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-right opacity-70 mt-1">{dayjs(msg.createdAt.toDate()).fromNow()}</p>
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </CardContent>
                        <CardFooter className="border-t pt-4">
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
                    </>
                ) : (
                    <CardContent className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">Select a conversation to start chatting.</p>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

