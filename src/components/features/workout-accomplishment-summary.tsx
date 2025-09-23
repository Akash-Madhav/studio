
'use client';

import { useState, useEffect } from 'react';
import { generateWorkoutSummary } from '@/ai/flows/workout-summary-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';

interface Workout {
    _id: string;
    exercise: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    createdAt: Date;
}

interface PhysiqueAnalysis {
    id: string;
    summary: string;
    rating: { score: number; justification: string };
    createdAt: Date;
}

interface WorkoutSummaryProps {
    userId: string;
    workouts: Workout[];
    physiqueHistory: PhysiqueAnalysis[];
    isLoading: boolean;
}

export default function WorkoutSummary({ userId, workouts, physiqueHistory, isLoading: isLoadingData }: WorkoutSummaryProps) {
    const [summary, setSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsGenerating(false);
            return;
        }
        
        if (isLoadingData) {
            setIsGenerating(true);
            return;
        }

        const fetchAndSummarize = async () => {
            setIsGenerating(true);
            try {
                let workoutHistoryText = "No workouts logged yet.";
                if (workouts.length > 0) {
                    workoutHistoryText = workouts.slice(0, 20).map(w => {
                        const parts = [dayjs(w.createdAt).format("YYYY-MM-DD"), w.exercise];
                        if (w.reps) parts.push(`${w.reps} reps`);
                        if (w.weight) parts.push(`@ ${w.weight}kg`);
                        if (w.distance) parts.push(`${w.distance}km`);
                        if (w.time) parts.push(`in ${w.time}`);
                        return parts.join(' ');
                    }).join('; ');
                }

                let physiqueAnalysisText = "No physique analysis available.";
                if (physiqueHistory.length > 0) {
                    const latestAnalysis = physiqueHistory[0];
                    physiqueAnalysisText = `Score: ${latestAnalysis.rating.score}/100. Summary: ${latestAnalysis.summary}`;
                }
                
                const summaryResult = await generateWorkoutSummary({
                    workoutHistory: workoutHistoryText,
                    physiqueAnalysis: physiqueAnalysisText,
                });

                setSummary(summaryResult.summary);
            } catch (error) {
                console.error('Failed to generate workout summary:', error);
                setSummary('Could not load your summary at this time. Please try again later.');
            } finally {
                setIsGenerating(false);
            }
        };

        fetchAndSummarize();
    }, [userId, workouts, physiqueHistory, isLoadingData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Your Progress Summary
                </CardTitle>
                <CardDescription>
                    An AI-generated motivational summary of your recent accomplishments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isGenerating ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : (
                    <p className="text-muted-foreground italic">"{summary}"</p>
                )}
            </CardContent>
        </Card>
    );
}
