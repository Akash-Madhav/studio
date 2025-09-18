"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateWorkoutSummary } from '@/ai/flows/workout-summary-flow';
import { getPhysiqueHistory } from '@/app/actions';
import dayjs from 'dayjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface Workout {
    _id: string;
    exercise: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    createdAt: Date;
}

interface WorkoutAccomplishmentSummaryProps {
    userId: string;
    workouts: Workout[];
    isLoading: boolean;
}

function formatWorkoutHistory(workouts: Workout[]): string {
    if (workouts.length === 0) {
        return "No workouts logged yet.";
    }
    return workouts
        .slice(0, 15) // Limit to the last 15 workouts for the summary
        .map(w => {
            const parts = [dayjs(w.createdAt).format("YYYY-MM-DD"), w.exercise];
            if (w.reps) parts.push(`${w.reps} reps`);
            if (w.weight) parts.push(`@ ${w.weight}kg`);
            if (w.distance) parts.push(`${w.distance}km`);
            if (w.time) parts.push(`in ${w.time}`);
            return parts.join(' ');
        })
        .join('; ');
}

export default function WorkoutAccomplishmentSummary({ userId, workouts, isLoading: isLoadingWorkouts }: WorkoutAccomplishmentSummaryProps) {
    const { toast } = useToast();
    const [summary, setSummary] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        setSummary(null);

        if (workouts.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Workouts Found',
                description: 'Please log some workouts before generating a summary.',
            });
            setIsGenerating(false);
            return;
        }

        try {
            // 1. Fetch the latest physique analysis
            const physiqueRes = await getPhysiqueHistory(userId, 1);
            let latestPhysique = "No physique analysis on record.";
            if (physiqueRes.success && physiqueRes.analyses.length > 0) {
                const analysis = physiqueRes.analyses[0];
                latestPhysique = `Score: ${analysis.rating.score}/100. Summary: ${analysis.summary}`;
            }

            // 2. Format workout history
            const formattedHistory = formatWorkoutHistory(workouts);
            
            // 3. Call the AI flow
            const result = await generateWorkoutSummary({
                workoutHistory: formattedHistory,
                physiqueAnalysis: latestPhysique,
            });
            
            setSummary(result);

        } catch (error: any) {
            console.error("Error generating summary:", error);
            let errorDescription = "An unexpected error occurred. Please try again.";
            if (error.message?.includes("503") || error.message?.includes("overloaded")) {
                errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
            }
            toast({
                variant: 'destructive',
                title: 'Summary Generation Failed',
                description: errorDescription,
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleClearSummary = () => {
        setSummary(null);
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>AI-Powered Progress Summary</CardTitle>
                <CardDescription>
                    Get a motivational summary of your recent accomplishments based on your workout and physique history.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {summary ? (
                     <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-primary">Your Summary</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{summary}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Data to be Analyzed</h4>
                        <ScrollArea className="h-48 p-3 rounded-md border bg-muted/50">
                            {isLoadingWorkouts ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin" />
                                </div>
                            ) : (
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                                    {formatWorkoutHistory(workouts)}
                                </pre>
                            )}
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 {summary ? (
                     <Button onClick={handleClearSummary} variant="outline" className="w-full">
                        <RefreshCcw className="mr-2"/>
                        Generate New Summary
                    </Button>
                 ) : (
                    <Button onClick={handleGenerateSummary} disabled={isGenerating || isLoadingWorkouts} className="w-full">
                        {(isGenerating || isLoadingWorkouts) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoadingWorkouts ? "Loading Data..." : isGenerating ? "Generating..." : "Generate My Summary"}
                        <Sparkles className="ml-2"/>
                    </Button>
                 )}
            </CardFooter>
        </Card>
    );
}
