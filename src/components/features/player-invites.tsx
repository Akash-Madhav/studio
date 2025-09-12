
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { respondToInvite, getUsersByIds } from "@/app/actions";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserX, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

dayjs.extend(relativeTime);

interface Invite {
    inviteId: string;
    coachId: string;
    coachName: string;
    sentAt: Date;
}

export default function PlayerInvites({ userId }: { userId: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'invites'),
            where('playerId', '==', userId),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setIsLoading(true);
            const coachIds = new Set<string>();
            snapshot.docs.forEach(doc => coachIds.add(doc.data().coachId));

            const usersRes = await getUsersByIds(Array.from(coachIds));
             if (!usersRes.success) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to load coach details." });
                setIsLoading(false);
                return;
            }
            const usersMap = usersRes.users;

            const invitesData = snapshot.docs.map(doc => {
                const data = doc.data();
                const coach = usersMap[data.coachId];
                const sentAt = data.sentAt as Timestamp;
                return {
                    inviteId: doc.id,
                    coachId: data.coachId,
                    coachName: coach?.name || 'Unknown Coach',
                    sentAt: sentAt ? sentAt.toDate() : new Date(),
                } as Invite;
            });
            setInvites(invitesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching invites:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to fetch invites." });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);

    const handleResponse = async (inviteId: string, coachId: string, response: 'accepted' | 'declined') => {
        setIsResponding(inviteId);
        const result = await respondToInvite({
            inviteId,
            response,
            playerId: userId,
            coachId
        });

        if (result.success) {
            toast({
                title: `Invite ${response}`,
                description: `You have ${response} the invitation.`,
            });
            
            if (response === 'accepted' && result.conversationId) {
               const role = searchParams.get('role');
               const newUrl = `/dashboard?role=${role}&userId=${userId}&tab=messages&conversationId=${result.conversationId}`;
               router.push(newUrl);
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message || 'Failed to respond to invite.'
            });
        }
        setIsResponding(null);
    };

    return (
        <Card className="border-0 shadow-none max-w-4xl mx-auto">
            <CardHeader className="px-0">
                <CardTitle>Your Recruitment Invites</CardTitle>
                <CardDescription>
                    Coaches who are interested in you will appear here. Respond to join their team.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : invites.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 border rounded-lg">
                        <UserX className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Pending Invites</h3>
                        <p>When a coach invites you, it will show up here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invites.map((invite) => (
                            <Card key={invite.inviteId} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback>{invite.coachName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{invite.coachName}</CardTitle>
                                            <CardDescription>Invited {dayjs(invite.sentAt).fromNow()}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardFooter className="flex-grow flex items-end gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={() => handleResponse(invite.inviteId, invite.coachId, 'declined')}
                                        disabled={isResponding === invite.inviteId}
                                    >
                                        {isResponding === invite.inviteId && <Loader2 className="animate-spin"/>}
                                        <X className="mr-2 h-4 w-4" />
                                        Decline
                                    </Button>
                                    <Button 
                                        className="w-full"
                                        onClick={() => handleResponse(invite.inviteId, invite.coachId, 'accepted')}
                                        disabled={isResponding === invite.inviteId}
                                    >
                                        {isResponding === invite.inviteId ? <Loader2 className="animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                                        Accept
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
