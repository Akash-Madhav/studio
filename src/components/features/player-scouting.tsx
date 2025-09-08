
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, UserCheck, Search } from "lucide-react";
import {
  getPlayerRecommendations,
  PlayerScoutingOutput,
} from "@/ai/flows/player-scouting-flow";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  sport: z.string().min(1, "Sport is required."),
});

// Mock data for players, in a real application this would come from a database.
const mockPlayersData = [
  {
    id: "player-1",
    performanceData: "Excellent stamina, 5k run in 18 minutes. Lifts 1.5x bodyweight in squats.",
    userProfile: "22-year-old male, competitive runner, aims to go pro.",
  },
  {
    id: "player-2",
    performanceData: "Explosive power, high vertical jump. Can sprint 100m in 11.5s.",
    userProfile: "20-year-old female, basketball player, focuses on agility and power.",
  },
  {
    id: "player-3",
    performanceData: "Great hand-eye coordination and reflexes. Excels at racket sports.",
    userProfile: "25-year-old male, recreational tennis player.",
  },
  {
    id: "player-4",
    performanceData: "Strong swimmer, can swim 1500m under 25 minutes. Good upper body strength.",
    userProfile: "19-year-old female, competitive swimmer, trains 5 times a week.",
  },
];

export default function PlayerScouting() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] =
    useState<PlayerScoutingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: "Soccer",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await getPlayerRecommendations({
        sport: values.sport,
        playersData: mockPlayersData,
      });
      setRecommendations(result);
    } catch (error) {
      console.error("Failed to get player recommendations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to generate player recommendations. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Player Scouting</CardTitle>
          <CardDescription>
            Find the best talent for your team. Enter a sport to discover promising players.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basketball, Soccer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2" />
                )}
                Find Players
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Player Recommendations</CardTitle>
          <CardDescription>
            AI-powered analysis of potential recruits for your sport.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {recommendations.recommendations.map((rec, index) => (
                <AccordionItem value={`item-${index}`} key={rec.playerId}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                      <UserCheck className="text-accent" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{rec.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Suitability: {rec.suitabilityScore}%
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div>
                      <Progress value={rec.suitabilityScore} className="h-2 mb-2" />
                      <h4 className="font-semibold text-primary mb-1">Analysis</h4>
                      <p className="text-sm text-muted-foreground">{rec.analysis}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Scouting Report</h4>
                      <p className="text-sm text-muted-foreground">{rec.report}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            !isLoading && (
              <div className="text-center text-muted-foreground py-12">
                Player recommendations will appear here.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
