
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
import { sampleWorkouts, sampleUsers } from "@/lib/sample-data";

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
  performanceData: z.string().min(1, "Performance data is required."),
});

function getPerformanceSummary(userId: string) {
    const userWorkouts = sampleWorkouts
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  
    if (userWorkouts.length === 0) {
      return "No recent workouts to analyze.";
    }
  
    return userWorkouts
      .map((data) => {
        let record = `${data.exercise}:`;
        if (data.reps) record += ` ${data.reps} reps`;
        if (data.weight) record += ` at ${data.weight}kg`;
        if (data.distance) record += ` for ${data.distance}km`;
        if (data.time) record += ` in ${data.time}`;
        return record;
      })
      .join("\n");
  }

export default function PersonalizedRecommendations({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [recommendations, setRecommendations] =
    useState<PersonalizedTrainingRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fitnessGoals: "",
      performanceData: "",
    },
  });

  useEffect(() => {
    if (userId) {
        const user = sampleUsers.find(u => u.id === userId);
        form.setValue('fitnessGoals', user?.goals || '');
        form.setValue('performanceData', getPerformanceSummary(userId));
    }
  }, [userId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await generatePersonalizedRecommendations(values);
      setRecommendations(result);
    } catch (error) {
      console.error("Failed to get AI recommendations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to generate AI recommendations. Please try again.",
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
              <FormField
                control={form.control}
                name="performanceData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent Performance Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summarize your recent workouts, including exercises, weights, reps, times, etc."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
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
