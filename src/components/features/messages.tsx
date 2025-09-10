
"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useSearchParams } from 'next/navigation';
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Conversation } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ScrollArea } from "../ui/scroll-area";
import { onSnapshot, collection, query, where, orderBy, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUser, sendMessage } from '@/app/actions';

dayjs.extend(relativeTime);

interface Message {
    _id: string;
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
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!userId) return;

        const convosQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId));
        
        const unsubscribe = onSnapshot(convosQuery, async (snapshot) => {
            const convosData = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                const participantIds = data.participantIds.filter((id: string) => id !== userId);
                const participants = await Promise.all(participantIds.map(async (id: string) => {
                    const userRes = await getUser(id);
                    return { id, name: userRes.user?.name || 'Unknown' };
                }));

                const messagesCol = collection(db, 'conversations', d.id, 'messages');
                const lastMsgQuery = query(messagesCol, orderBy('createdAt', 'desc'));
                const lastMsgSnapshot = await getDocs(lastMsgQuery);
                const lastMessageData = lastMsgSnapshot.docs[0]?.data();
                const lastMessage = lastMessageData ? {
                    text: lastMessageData.text,
                    sentAt: (lastMessageData.createdAt as Timestamp).toDate(),
                } : undefined;

                return { id: d.id, participants, lastMessage };
            }));

            const sortedConversations = convosData.sort((a, b) => {
                if (!a.lastMessage) return 1;
                if (!b.lastMessage) return -1;
                return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
            });

            setConversations(sortedConversations);
            
            if (!selectedConversation) {
                const preselectedConvoId = searchParams.get('conversationId');
                if (preselectedConvoId) {
                    const convo = sortedConversations.find(c => c.id === preselectedConvoId);
                    if (convo) handleSelectConversation(convo);
                } else if (sortedConversations.length > 0) {
                    handleSelectConversation(sortedConversations[0]);
                }
            }

            setIsLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);


    useEffect(() => {
        if (!selectedConversation) return;

        setIsLoadingMessages(true);
        const messagesQuery = query(
            collection(db, 'conversations', selectedConversation.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp).toDate(),
            })) as Message[];
            setMessages(messagesData);
            setIsLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [selectedConversation]);


    const handleSelectConversation = (convo: Conversation) => {
        setSelectedConversation(convo);
    };

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
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
            setNewMessage("");
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-250px)]">
            <Card className="col-span-1 md:col-span-4 flex flex-col">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                    <CardContent>
                        {isLoadingConversations ? (
                            <div className="flex justify-center items-center h-full pt-12">
                                <Loader2 className="animate-spin"/>
                            </div>
                        ) : conversations.length > 0 ? (
                            <div className="space-y-2">
                            {conversations.map(convo => (
                                    <div 
                                        key={convo.id}
                                        onClick={() => handleSelectConversation(convo)}
                                        className={`p-3 rounded-lg cursor-pointer border border-transparent ${selectedConversation?.id === convo.id ? 'bg-accent' : 'hover:bg-muted'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://picsum.photos/seed/${getOtherParticipant(convo)?.id}/50/50`} data-ai-hint="person face" />
                                                <AvatarFallback>{getOtherParticipant(convo)?.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{getOtherParticipant(convo)?.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.text}</p>
                                            </div>
                                            {convo.lastMessage && <p className="text-xs text-muted-foreground self-start shrink-0">{dayjs(convo.lastMessage.sentAt).fromNow(true)}</p>}
                                        </div>
                                    </div>
                            ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground pt-12">
                                No conversations yet.
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>

            <Card className="col-span-1 md:col-span-8 flex flex-col">
                {selectedConversation ? (
                    <>
                        <CardHeader className="border-b flex-shrink-0">
                            <CardTitle className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${getOtherParticipant(selectedConversation)?.id}/50/50`} data-ai-hint="person face" />
                                    <AvatarFallback>{getOtherParticipant(selectedConversation)?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {getOtherParticipant(selectedConversation)?.name}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-grow bg-muted/20">
                            <CardContent className="p-4 space-y-4">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center items-center h-full pt-12">
                                        <Loader2 className="animate-spin"/>
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map(msg => (
                                        <div key={msg._id} className={`flex items-end gap-2 ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                                            {msg.senderId !== userId && 
                                                <Avatar className="h-8 w-8 self-start">
                                                    <AvatarImage src={`https://picsum.photos/seed/${msg.senderId}/40/40`} data-ai-hint="person face"/>
                                                    <AvatarFallback>{getOtherParticipant(selectedConversation)?.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            }
                                            <div className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                                <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                                                <p className="text-xs text-right opacity-70 mt-1">{dayjs(msg.createdAt).fromNow(true)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground pt-12">
                                        No messages yet. Say hello!
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>
                        </ScrollArea>
                        <CardFooter className="border-t pt-4 flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                                <Input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={isSending || isLoadingMessages}
                                />
                                <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                                </Button>
                            </form>
                        </CardFooter>
                    </>
                ) : (
                    <CardContent className="flex justify-center items-center h-full">
                         {isLoadingConversations ? <Loader2 className="animate-spin"/> : <p className="text-muted-foreground">{conversations.length > 0 ? "Select a conversation to start chatting." : "You have no conversations."}</p>}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
