
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Medal } from "lucide-react";
import {
  suggestSports,
  SportSuggestionOutput,
} from "@/ai/flows/ai-sport-match-suggestion";
import { getWorkoutHistory } from "@/app/actions";

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
  performanceData: z.string(), // Kept for internal state, but not shown in UI
  userPreferences: z.string().min(1, "User preferences are required."),
});


async function getPerformanceSummary(userId: string) {
    const result = await getWorkoutHistory(userId);
    if (!result.success || result.workouts.length === 0) {
        return "No recent workouts to analyze.";
    }

    // Get top 5
    const recentWorkouts = result.workouts.slice(0, 5);

    return recentWorkouts
      .map((data) => {
        let record = `${data.exercise}:`;
        if (data.reps) record += ` ${data.reps} reps`;
        if (data.weight) record += ` at ${data.weight}kg`;
        if (data.distance) record += ` for ${data.distance}km`;
        if (data.time) record += ` in ${data.time}`;
        return record;
      })
      .join(", ");
}

export default function SportMatch({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SportSuggestionOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      performanceData: "",
      userPreferences:
        "Enjoy team sports, competitive environments, and being outdoors.",
    },
  });

  useEffect(() => {
    async function loadPerformanceData() {
        if (userId) {
            const summary = await getPerformanceSummary(userId);
            form.setValue('performanceData', summary);
        }
    }
    loadPerformanceData();
  }, [userId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestions(null);

    try {
      const result = await suggestSports({
        performanceData: values.performanceData,
        userPreferences: values.userPreferences,
      });
      setSuggestions(result);
    } catch (error: any) {
      console.error("Failed to get AI sport suggestions:", error);
      let errorDescription = "Failed to generate sport suggestions. Please try again.";
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
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Find Your Sport</CardTitle>
          <CardDescription>
            Discover sports you might excel at based on your current fitness
            profile and preferences. Your workout history is automatically analyzed.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="userPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Preferences</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., I prefer individual sports, enjoy strategy, and don't like early mornings."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !form.getValues('performanceData')} className="w-full">
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Match Me
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Sport Matches</CardTitle>
          <CardDescription>
            Based on your profile, here are some sports you might love.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {suggestions ? (
            <ul className="space-y-4">
              {suggestions.suggestions.map((suggestion, index) => (
                <li key={index} className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-primary flex items-center mb-2">
                    <Medal className="w-5 h-5 mr-2 text-accent" />
                    {suggestion.sport}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.reason}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && (
              <div className="text-center text-muted-foreground py-12">
                Your sport matches will appear here.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
