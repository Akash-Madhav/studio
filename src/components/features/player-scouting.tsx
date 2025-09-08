
"use client";

import { useState, useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, UserCheck, Search, Send } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import {
  getPlayerRecommendations,
  PlayerScoutingOutput,
} from "@/ai/flows/player-scouting-flow";
import { getPlayersForScouting, sendRecruitInvite } from "@/app/actions";

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
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  sport: z.string().min(1, "Sport is required."),
});

interface PlayerData {
  id: string;
  name: string;
  performanceData: string;
  userProfile: string;
  status: string;
}

export default function PlayerScouting() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('userId') || 'coach1';

  const [recommendations, setRecommendations] =
    useState<PlayerScoutingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchPlayers() {
      setIsFetchingPlayers(true);
      const result = await getPlayersForScouting();
      if (result.success && result.players) {
        setPlayers(result.players.map(p => ({...p, name: p.name || `Player ${p.id.substring(0,4)}`})));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch player data.",
        });
      }
      setIsFetchingPlayers(false);
    }
    fetchPlayers();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: "Soccer",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendations(null);

    if (players.length === 0) {
        toast({
            variant: "destructive",
            title: "No Players Found",
            description: "There are no players in the database to scout.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const scoutablePlayers = players.filter(p => p.status === 'active');
      if (scoutablePlayers.length === 0) {
        toast({
            title: "All players have pending invites!",
            description: "Check the 'Invites' tab to see their status.",
        });
        setIsLoading(false);
        return;
      }

      const result = await getPlayerRecommendations({
        sport: values.sport,
        playersData: scoutablePlayers.map(p => ({
            id: p.id,
            performanceData: p.performanceData,
            userProfile: p.userProfile
        }))
      });
      setRecommendations(result);
    } catch (error: any) {
      console.error("Failed to get player recommendations:", error);
      const errorMessage = error.message || "Failed to generate player recommendations. Please try again.";
      let errorDescription = "An unexpected error occurred. Please check the console and try again.";
      if (errorMessage.includes("503 Service Unavailable") || errorMessage.includes("overloaded")) {
        errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
      }

      toast({
        variant: "destructive",
        title: "Scouting Error",
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendInvite = (playerId: string, playerName: string) => {
    startTransition(async () => {
        setIsSendingInvite(playerId);
        const result = await sendRecruitInvite(playerId, coachId);
        if (result.success) {
            toast({
                title: "Invite Sent!",
                description: result.message,
            });
            // Update player status locally
            setPlayers(prev => prev.map(p => p.id === playerId ? {...p, status: 'pending_invite' } : p));
            setRecommendations(prev => prev ? ({
                ...prev,
                recommendations: prev.recommendations.filter(r => r.playerId !== playerId)
            }) : null);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message || 'Failed to send invite. Please try again.'
            });
        }
        setIsSendingInvite(null);
    });
  }

  const getPlayerStatus = (playerId: string) => {
    return players.find(p => p.id === playerId)?.status;
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
              <Button type="submit" disabled={isLoading || isFetchingPlayers} className="w-full">
                {isLoading || isFetchingPlayers ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2" />
                )}
                {isFetchingPlayers ? 'Loading Players...' : 'Find Players'}
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
                      {getPlayerStatus(rec.playerId) === 'pending_invite' && (
                          <Badge variant="secondary">Invite Pending</Badge>
                      )}
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
                     <div className="pt-2 border-t">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleSendInvite(rec.playerId, rec.playerName)}
                        disabled={isPending && isSendingInvite === rec.playerId}
                      >
                         {isPending && isSendingInvite === rec.playerId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                            <Send className="mr-2 h-4 w-4" />
                         )}
                        Send Recruit Invite
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            !isLoading && (
                <div className="text-center text-muted-foreground py-12">
                    {isFetchingPlayers
                        ? "Fetching player data..."
                        : players.length === 0 
                        ? "No players found to scout. New players will appear here once they log a workout."
                        : "Player recommendations will appear here."}
                </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
