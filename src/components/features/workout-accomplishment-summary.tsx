
"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateWorkoutSummary } from "@/ai/flows/workout-summary-flow";
import { getPhysiqueHistory } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import { ScrollArea } from "../ui/scroll-area";

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
        return "";
    }
  
    // Sort workouts from oldest to newest for the summary
    const sortedWorkouts = [...workouts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return sortedWorkouts
      .map((w) => {
        let record = `${dayjs(w.createdAt).format('YYYY-MM-DD')} - ${w.exercise}:`;
        const details = [];
        if (w.reps) details.push(`${w.reps} reps`);
        if (w.weight) details.push(`${w.weight}kg`);
        if (w.distance) details.push(`${w.distance}km`);
        if (w.time) details.push(w.time);
        return `${record} ${details.join(', ')}`;
      })
      .join("\n");
}

export default function WorkoutAccomplishmentSummary({ userId, workouts, isLoading: isFetchingData }: WorkoutAccomplishmentSummaryProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);

    const formattedHistory = formatWorkoutHistory(workouts);
    if (!formattedHistory.trim()) {
      toast({
        variant: "destructive",
        title: "No Workouts Found",
        description: "Log some workouts before generating a summary.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Fetch the latest physique analysis
      const physiqueRes = await getPhysiqueHistory(userId, 1);
      let formattedPhysique = "";
      if (physiqueRes.success && physiqueRes.analyses.length > 0) {
        const latestPhysique = physiqueRes.analyses[0];
        formattedPhysique = `Score: ${latestPhysique.rating.score}/100. Summary: ${latestPhysique.summary}`;
      }

      const result = await generateWorkoutSummary({
        workoutHistory: formattedHistory,
        physiqueAnalysis: formattedPhysique || undefined,
      });
      setSummary(result);
    } catch (error: any) {
      console.error("Failed to get workout summary:", error);
      let errorDescription = "Failed to generate your summary. Please try again.";
      if (error.message?.includes("503") || error.message?.includes("overloaded")) {
          errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
      }
      toast({
          variant: "destructive",
          title: "Error",
          description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Workout Accomplishment Summary</CardTitle>
          <CardDescription>
            Get a detailed AI-powered summary of your entire fitness journey and latest physique analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            ) : summary ? (
                <ScrollArea className="h-96 pr-4">
                    <div className="p-4 bg-muted/50 rounded-md whitespace-pre-line text-sm leading-relaxed">
                        {summary}
                    </div>
                </ScrollArea>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    Click the button below to generate your personalized accomplishment summary.
                </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button onClick={handleGenerateSummary} disabled={isLoading || isFetchingData} className="w-full">
                {(isLoading || isFetchingData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isFetchingData ? "Loading Workout Data..." : summary ? "Regenerate Summary" : "Generate My Summary"}
            </Button>
             {summary && (
                <Button variant="ghost" onClick={() => setSummary(null)}>Clear Summary</Button>
            )}
        </CardFooter>
    </Card>
  );
}
