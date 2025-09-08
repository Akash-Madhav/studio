
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import {
  getFitnessInsights,
  FitnessInsightsOutput,
} from "@/ai/flows/ai-driven-fitness-insights";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  exerciseType: z.string().min(1, "Exercise type is required."),
  metrics: z.string().min(1, "Metrics are required."),
  userProfile: z.string().optional(),
});

export default function AiInsights() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<FitnessInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exerciseType: "Weightlifting",
      metrics: "reps: 8\nweight: 70kg\nsets: 3",
      userProfile: "Goal: Increase strength",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setInsights(null);

    const metricsObject: Record<string, number> = {};
    values.metrics.split("\n").forEach((line) => {
      const [key, value] = line.split(":");
      if (key && value) {
        const numValue = parseFloat(value.trim());
        if (!isNaN(numValue)) {
          metricsObject[key.trim()] = numValue;
        }
      }
    });

    try {
      const result = await getFitnessInsights({
        exerciseType: values.exerciseType,
        metrics: metricsObject,
        userProfile: values.userProfile,
      });
      setInsights(result);
    } catch (error) {
      console.error("Failed to get AI insights:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Get AI-Driven Insights</CardTitle>
          <CardDescription>
            Analyze your performance for a specific activity to uncover trends
            and opportunities.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="exerciseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Running" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metrics</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g.,&#10;distance: 5&#10;time: 25"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter each metric on a new line (key: value).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Profile (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 30yo male, intermediate fitness level, goal is to run a marathon."
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
                Generate Insights
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Insights</CardTitle>
          <CardDescription>
            Here's what our AI thinks about your performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {insights ? (
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-semibold text-primary mb-2">Summary</h3>
                <p className="text-muted-foreground">{insights.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Strengths</h3>
                <p className="text-muted-foreground">{insights.strengths}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">Weaknesses</h3>
                <p className="text-muted-foreground">{insights.weaknesses}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Recommendations
                </h3>
                <p className="text-muted-foreground">
                  {insights.recommendations}
                </p>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="text-center text-muted-foreground py-12">
                Your insights will appear here.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
