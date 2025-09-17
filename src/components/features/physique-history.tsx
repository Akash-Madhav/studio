
"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, History, MessageSquareQuote } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '../ui/scroll-area';


dayjs.extend(relativeTime);

interface Analysis {
    id: string;
    createdAt: string;
    summary: string;
}

interface PhysiqueHistoryProps {
    userId: string;
}

export default function PhysiqueHistory({ userId }: PhysiqueHistoryProps) {
    const { toast } = useToast();
    const [history, setHistory] = useState<Analysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const analysesQuery = query(
            collection(db, 'users', userId, 'physique_analyses'),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(analysesQuery, (snapshot) => {
            const analysesData = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    id: doc.id,
                    summary: data.summary,
                    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date().toISOString(),
                } as Analysis;
            });
            setHistory(analysesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching physique history:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load physique history.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Physique Progress</CardTitle>
                <CardDescription>
                    Review your logged physique analysis summaries over time.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        <History className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No History Yet</h3>
                        <p>Log your first physique analysis to start tracking your progress.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-96 pr-4">
                        <div className="space-y-4">
                            {history.map(item => (
                                <div key={item.id} className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                                        {dayjs(item.createdAt).format("MMMM D, YYYY")} - {dayjs(item.createdAt).fromNow()}
                                    </p>
                                    <div className="flex items-start gap-3">
                                        <MessageSquareQuote className="h-5 w-5 text-primary mt-1" />
                                        <p className="text-sm flex-1">{item.summary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
