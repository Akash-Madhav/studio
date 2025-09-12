
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import {
  generatePersonalizedRecommendations,
  PersonalizedTrainingRecommendationsOutput,
} from "@/ai/flows/personalized-training-recommendations";
import { getUser } from "@/app/actions";
import dayjs from 'dayjs';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fitnessGoals: z.string().min(1, "Fitness goals are required."),
});

interface Workout {
    _id: string;
    exercise: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    createdAt: Date;
}

interface PersonalizedRecommendationsProps {
  userId: string;
  workouts: Workout[];
  isLoading: boolean;
}

function getPerformanceSummary(workouts: Workout[]) {
    if (workouts.length === 0) {
        return "No recent workouts to analyze.";
    }
  
    return workouts
      .slice(0, 10)
      .map((data) => {
        let record = `${dayjs(data.createdAt).format('YYYY-MM-DD')} - ${data.exercise}:`;
        if (data.reps) record += ` ${data.reps} reps`;
        if (data.weight) record += ` at ${data.weight}kg`;
        if (data.distance) record += ` for ${data.distance}km`;
        if (data.time) record += ` in ${data.time}`;
        return record;
      })
      .join("\n");
}

export default function PersonalizedRecommendations({ userId, workouts, isLoading: isFetchingData }: PersonalizedRecommendationsProps) {
  const { toast } = useToast();
  const [recommendations, setRecommendations] =
    useState<PersonalizedTrainingRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fitnessGoals: "",
    },
  });
  
  useEffect(() => {
    async function loadGoals() {
        if (userId) {
            const userRes = await getUser(userId);
            if (userRes.success && userRes.user) {
                 form.setValue('fitnessGoals', userRes.user.goals || '');
            }
        }
    }
    loadGoals();
  }, [userId, form]);

  useEffect(() => {
    if (!isFetchingData) {
        const summary = getPerformanceSummary(workouts);
        setPerformanceData(summary);
    }
  }, [workouts, isFetchingData]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);

    if (performanceData.startsWith("Error")) {
         toast({
            variant: "destructive",
            title: "Cannot Generate Recommendations",
            description: "Please resolve the data loading issue first.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const result = await generatePersonalizedRecommendations({
        ...values,
        performanceData,
      });
      setRecommendations(result);
    } catch (error: any) {
        console.error("Failed to get AI recommendations:", error);
        let errorDescription = "Failed to generate AI recommendations. Please try again.";
        if (error.message?.includes("503") || error.message?.includes("overloaded")) {
            errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
        } else if (error.message?.includes("index")) {
            errorDescription = "A database index is required. Please check the server logs for an index creation link."
        }
        toast({
            variant: "destructive",
            title: "Error",
            description: errorDescription,
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Get Personalized Recommendations</CardTitle>
          <CardDescription>
            Let our AI create a custom plan based on your goals and recent
            performance.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fitnessGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Fitness Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Lose 10kg, run a 5k under 25 minutes."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Recent Performance Data (Auto-Loaded)</FormLabel>
                <div className="p-3 rounded-md border bg-muted/50 min-h-[150px]">
                    {isFetchingData ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                            {performanceData}
                        </pre>
                    )}
                </div>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isFetchingData} className="w-full">
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Recommendations
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Plan</CardTitle>
          <CardDescription>
            Your personalized summary and suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {recommendations ? (
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Performance Summary
                </h3>
                <p className="text-muted-foreground">
                  {recommendations.summary}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Training Suggestions
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {recommendations.suggestions}
                </p>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center text-muted-foreground py-12">
                Your recommendations will appear here.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    