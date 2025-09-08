
"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
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

interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: Date;
}

export default function Messages({ userId }: { userId: string }) {
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!userId) return;
        async function fetchConversations() {
            setIsLoading(true);
            const result = await getConversations(userId);
            if(result.success && result.conversations) {
                const sortedConversations = result.conversations.sort((a, b) => {
                    if (!a.lastMessage) return 1;
                    if (!b.lastMessage) return -1;
                    return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime();
                });
                setConversations(sortedConversations);
                
                const preselectedConvoId = searchParams.get('conversationId');
                if (preselectedConvoId) {
                    const convo = sortedConversations.find(c => c.id === preselectedConvoId);
                    if (convo) {
                        setSelectedConversation(convo);
                    }
                } else if (sortedConversations.length > 0) {
                    setSelectedConversation(sortedConversations[0]);
                }

            } else {
                toast({ variant: 'destructive', title: "Error", description: "Failed to fetch conversations." });
            }
            setIsLoading(false);
        }
        fetchConversations();
    }, [toast, userId, searchParams]);

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
        } else {
            setMessages([]);
        }
    }, [selectedConversation, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !userId) return;

        setIsSending(true);
        const result = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: userId,
            text: newMessage,
        });

        if (result.success && result.message) {
            setMessages(prev => [...prev, result.message as Message]);
            setNewMessage("");
            
            const updatedConvo = {
                ...selectedConversation,
                lastMessage: {
                    text: result.message.text,
                    sentAt: result.message.createdAt,
                }
            };
            setSelectedConversation(updatedConvo);
            setConversations(prev => prev.map(c => c.id === updatedConvo.id ? updatedConvo : c)
                .sort((a, b) => {
                    if (!a.lastMessage) return 1;
                    if (!b.lastMessage) return -1;
                    return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime();
                })
            );

        } else {
            toast({ variant: 'destructive', title: "Error", description: "Failed to send message." });
        }
        setIsSending(false);
    };

    const getOtherParticipant = (convo: Conversation) => {
        return convo.participants.find(p => p.id !== userId);
    }
    
    if (!userId) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Please log in to see your messages.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            <Card className="col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    {isLoading || isPending ? (
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
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold">{getOtherParticipant(convo)?.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.text}</p>
                                        </div>
                                        {convo.lastMessage && <p className="text-xs text-muted-foreground self-start">{dayjs(convo.lastMessage.sentAt).fromNow()}</p>}
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
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === userId ? 'justify-end' : ''}`}>
                                    {msg.senderId !== userId && <Avatar className="h-8 w-8"><AvatarImage src={`https://picsum.photos/seed/${msg.senderId}/40/40`} data-ai-hint="person face"/></Avatar>}
                                    <div className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-right opacity-70 mt-1">{dayjs(msg.createdAt).fromNow()}</p>
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
                         {isLoading || isPending ? <Loader2 className="animate-spin"/> : <p className="text-muted-foreground">{conversations.length > 0 ? "Select a conversation to start chatting." : "No conversations yet."}</p>}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

    