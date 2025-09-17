
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, History, MessageSquareQuote, Star } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, Line } from "recharts";

dayjs.extend(relativeTime);

interface Analysis {
    id: string;
    createdAt: string;
    summary: string;
    rating: {
        score: number;
        justification: string;
    };
}

interface PhysiqueHistoryProps {
    userId: string;
}

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

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
                    rating: data.rating,
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
    
    const chartData = useMemo(() => {
        return history
            .map(item => ({
                date: dayjs(item.createdAt).format("MMM D"),
                score: item.rating.score,
            }))
            .reverse();
    }, [history]);

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
                    <div className="space-y-6">
                        {chartData.length > 1 && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Rating Over Time</h4>
                                 <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                    <LineChart
                                        accessibilityLayer
                                        data={chartData}
                                        margin={{
                                            left: 12,
                                            right: 12,
                                            top: 10,
                                            bottom: 10
                                        }}
                                        >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="line" />}
                                        />
                                        <Line
                                            dataKey="score"
                                            type="monotone"
                                            stroke="var(--color-score)"
                                            strokeWidth={2}
                                            dot={{
                                                fill: "var(--color-score)",
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                        )}
                       
                        <ScrollArea className="h-96 pr-4">
                            <div className="space-y-4">
                                {history.map(item => (
                                    <div key={item.id} className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {dayjs(item.createdAt).format("MMMM D, YYYY")} - {dayjs(item.createdAt).fromNow()}
                                            </p>
                                            {item.rating && (
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-accent"/> {item.rating.score}/100
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MessageSquareQuote className="h-5 w-5 text-primary mt-1" />
                                            <p className="text-sm flex-1">{item.summary}</p>
                                        </div>
                                        {item.rating?.justification && (
                                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-muted-foreground/20">
                                                <strong>Justification:</strong> {item.rating.justification}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
