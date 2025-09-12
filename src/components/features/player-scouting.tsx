
"use client";

import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, UserCheck, Search, Send, FileText, Check, ChevronsUpDown } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import {
  getPlayerRecommendations,
  PlayerScoutingOutput,
} from "@/ai/flows/player-scouting-flow";
import { suggestSportsList, SportSuggestionOutput } from "@/ai/flows/suggest-sports-list";
import { sendRecruitInvite } from "@/app/actions";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


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

interface PlayerScoutingProps {
    players: PlayerData[];
    isLoading: boolean;
    onInviteSent: () => void;
}

export default function PlayerScouting({ players, isLoading: isFetchingPlayers, onInviteSent }: PlayerScoutingProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('userId') || 'coach1';

  const [recommendations, setRecommendations] =
    useState<PlayerScoutingOutput | null>(null);
  const [isScouting, setIsScouting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);
  const [sportSuggestions, setSportSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sportQuery, setSportQuery] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: "Soccer",
    },
  });
  
  const getPlayerProfile = (playerId: string) => {
    return players.find(p => p.id === playerId)?.userProfile;
  }

  const fetchSportSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSportSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const result = await suggestSportsList(query);
      setSportSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to fetch sport suggestions:", error);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (sportQuery) {
        fetchSportSuggestions(sportQuery);
      } else {
        setSportSuggestions([]);
      }
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [sportQuery, fetchSportSuggestions]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsScouting(true);
    setRecommendations(null);

    const scoutablePlayers = players.filter(p => p.status === 'active');
    if (scoutablePlayers.length === 0) {
        toast({
            title: "No available players to scout.",
            description: "New players will appear here once they sign up and log a workout.",
        });
        setIsScouting(false);
        return;
    }

    try {
      const result = await getPlayerRecommendations({
        sport: values.sport,
        playersData: scoutablePlayers.map(p => ({
            id: p.id,
            name: p.name,
            performanceData: p.performanceData,
            userProfile: p.userProfile
        }))
      });
      setRecommendations(result);
    } catch (error: any) {
      console.error("Failed to get player recommendations:", error);
      let errorDescription = "Failed to generate player recommendations. Please try again.";
      if (error.message?.includes("503") || error.message?.includes("overloaded")) {
        errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
      }
      toast({
        variant: "destructive",
        title: "Scouting Error",
        description: errorDescription,
      });
    } finally {
      setIsScouting(false);
    }
  }

  const handleSendInvite = async (playerId: string) => {
    setIsSendingInvite(playerId);
    const result = await sendRecruitInvite(playerId, coachId);
    if (result.success) {
        toast({
            title: "Invite Sent!",
            description: result.message,
        });
        onInviteSent();
        setRecommendations(prev => {
          if (!prev) return null;
          return {
            ...prev,
            recommendations: prev.recommendations.map(r => 
              r.playerId === playerId ? { ...r, status: 'pending_invite' } : r
            )
          };
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message || 'Failed to send invite. Please try again.'
        });
    }
    setIsSendingInvite(null);
  }

  const getPlayerStatus = (playerId: string) => {
    return players.find(p => p.id === playerId)?.status;
  };

  const isLoading = isFetchingPlayers || isScouting;

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
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Select sport"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search for a sport..."
                            onValueChange={(search) => {
                              field.onChange(search);
                              setSportQuery(search);
                            }}
                            value={field.value}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {isFetchingSuggestions ? 'Searching...' : 'No sport found.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {sportSuggestions.map((sport) => (
                                <CommandItem
                                  value={sport}
                                  key={sport}
                                  onSelect={() => {
                                    form.setValue("sport", sport);
                                    setSportQuery("");
                                    setSportSuggestions([]);
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      sport === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {sport}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                       {getPlayerStatus(rec.playerId) === 'recruited' && (
                          <Badge variant="default">Recruited</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div>
                        <h4 className="font-semibold text-primary mb-1 flex items-center gap-2">
                           <FileText size={16}/> Mini Profile
                        </h4>
                        <p className="text-sm text-muted-foreground pl-6">{getPlayerProfile(rec.playerId)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Analysis</h4>
                      <p className="text-sm text-muted-foreground">{rec.analysis}</p>
                    </div>
                     <div>
                      <h4 className="font-semibold text-primary mb-1">Suitability Score</h4>
                      <Progress value={rec.suitabilityScore} className="h-2 mb-2" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Scouting Report</h4>
                      <p className="text-sm text-muted-foreground">{rec.report}</p>
                    </div>
                     <div className="pt-2 border-t">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleSendInvite(rec.playerId)}
                        disabled={isSendingInvite === rec.playerId || getPlayerStatus(rec.playerId) !== 'active'}
                      >
                         {isSendingInvite === rec.playerId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                            <Send className="mr-2 h-4 w-4" />
                         )}
                        {getPlayerStatus(rec.playerId) === 'pending_invite' ? 'Invite Sent' : getPlayerStatus(rec.playerId) === 'recruited' ? 'Already Recruited' : 'Send Recruit Invite'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            !isScouting && (
                <div className="text-center text-muted-foreground py-12">
                    {isFetchingPlayers
                        ? "Fetching player data..."
                        : players.filter(p => p.status === 'active').length === 0 
                        ? "No available players to scout. Players with pending invites or on a team are excluded."
                        : "Player recommendations will appear here."}
                </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
