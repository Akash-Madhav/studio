
"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getPhysiqueHistory } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, History } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import dayjs from 'dayjs';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface Analysis {
    id: string;
    createdAt: string;
    symmetry: {
        rating: number;
        comment: string;
    };
    muscleGroups: {
        [key: string]: {
            rating: number;
            comment: string;
        }
    };
    recommendations: string[];
}

interface PhysiqueHistoryProps {
    userId: string;
}

const chartConfig = {
  rating: {
    label: "Symmetry Rating",
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
            collection(db, 'physique_analyses'),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(analysesQuery, (snapshot) => {
            const analysesData = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    ...data,
                    id: doc.id,
                    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date().toISOString(),
                } as Analysis;
            });
            setHistory(analysesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching physique history:", error);
            let description = 'Could not load physique history.';
            if (error.message.includes("indexes")) {
                description = "A database index is required. Please check the server logs for a link to create it.";
            }
            toast({ variant: 'destructive', title: 'Error', description });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);

    const chartData = React.useMemo(() => {
        return [...history]
            .reverse()
            .map(item => ({
                date: dayjs(item.createdAt).format('MMM D'),
                rating: item.symmetry.rating,
            }));
    }, [history]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Physique Progress</CardTitle>
                <CardDescription>
                    Track your physique development over time.
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
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <TrendingUp className="text-primary"/>
                                Symmetry Rating Over Time
                            </h3>
                            <ChartContainer config={chartConfig} className="h-64 w-full">
                                <LineChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        fontSize={12}
                                    />
                                     <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickMargin={8}/>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        dataKey="rating"
                                        type="monotone"
                                        stroke="var(--color-rating)"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "var(--color-rating)",
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Analysis History</h3>
                            <Accordion type="single" collapsible className="w-full">
                                {history.map(item => (
                                    <AccordionItem value={item.id} key={item.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between w-full pr-4">
                                                <span>{dayjs(item.createdAt).format("MMMM D, YYYY")}</span>
                                                <Badge>Symmetry: {item.symmetry.rating}/10</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4">
                                             <div>
                                                <h4 className="font-semibold text-primary mb-2">Recommendations</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                                    {item.recommendations.map((rec, index) => (
                                                        <li key={index}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Muscle Group</TableHead>
                                                        <TableHead>Rating</TableHead>
                                                        <TableHead>Comment</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(item.muscleGroups).map(([group, data]) => (
                                                        <TableRow key={group}>
                                                            <TableCell className="capitalize font-medium">{group}</TableCell>
                                                            <TableCell><Badge variant="secondary">{data.rating}/10</Badge></TableCell>
                                                            <TableCell>{data.comment}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
