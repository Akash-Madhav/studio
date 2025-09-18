
"use client";

import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useForm as useSearchForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, UserCheck, Search, Send, FileText, Check, ChevronsUpDown, ShieldCheck, Mail, UserX, UserSearch, Sparkles, Scale } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import {
  getPlayerRecommendations,
  PlayerScoutingOutput,
} from "@/ai/flows/player-scouting-flow";
import { sendRecruitInvite, findPlayerByEmail } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";


const aiFormSchema = z.object({
  sport: z.string().min(1, "Sport is required."),
});

const searchFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const sportsList = [
    { value: "soccer", label: "Soccer" },
    { value: "basketball", label: "Basketball" },
    { value: "football", label: "American Football" },
    { value: "baseball", label: "Baseball" },
    { value: "tennis", label: "Tennis" },
    { value: "volleyball", label: "Volleyball" },
    { value: "track and field", label: "Track & Field" },
    { value: "swimming", label: "Swimming" },
    { value: "hockey", label: "Hockey" },
    { value: "cricket", label: "Cricket" },
]

interface PlayerData {
  id: string;
  name: string;
  performanceData: string;
  userProfile: string;
  physiqueAnalysis?: string;
  status: string;
  coachId?: string;
}

interface PlayerScoutingProps {
    players: PlayerData[];
    isLoading: boolean;
    onInviteSent: () => void;
}

export default function PlayerScouting({ players, isLoading: isFetchingPlayers, onInviteSent }: PlayerScoutingProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const coachId = searchParams.get('userId') || '';

  // State for AI Scouting
  const [recommendations, setRecommendations] = useState<PlayerScoutingOutput | null>(null);
  const [isScouting, setIsScouting] = useState(false);
  const [open, setOpen] = useState(false)
  
  // State for Email Search
  const [searchedPlayer, setSearchedPlayer] = useState<any | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);


  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: { sport: "" },
  });

  const searchForm = useSearchForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: { email: "" },
  });
  
  const getPlayerProfile = (playerId: string) => {
    return players.find(p => p.id === playerId)?.userProfile;
  }

  async function onAiSubmit(values: z.infer<typeof aiFormSchema>) {
    setIsScouting(true);
    setRecommendations(null);

    if (players.length === 0) {
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
        playersData: players.map(p => ({
            id: p.id,
            name: p.name,
            performanceData: p.performanceData,
            userProfile: p.userProfile,
            physiqueAnalysis: p.physiqueAnalysis,
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

  async function onSearchSubmit(values: z.infer<typeof searchFormSchema>) {
    setIsSearching(true);
    setSearchedPlayer(null);
    setSearchMessage(null);
    const result = await findPlayerByEmail(values.email);
    if (result.success) {
        setSearchedPlayer(result.player);
    } else {
        setSearchMessage(result.message || 'An error occurred.');
    }
    setIsSearching(false);
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
        
        // Update state for AI recs
        setRecommendations(prev => {
          if (!prev) return null;
          return {
            ...prev,
            recommendations: prev.recommendations.map(r => 
              r.playerId === playerId ? { ...r, status: 'pending_invite' } : r
            )
          };
        });
        
        // Update state for searched player
        if (searchedPlayer && searchedPlayer.id === playerId) {
            setSearchedPlayer((prev: any) => ({...prev, status: 'pending_invite'}));
        }
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
    if (searchedPlayer && searchedPlayer.id === playerId) {
        return searchedPlayer.status;
    }
    const player = players.find(p => p.id === playerId);
    if (player?.status === 'recruited' && player.coachId === coachId) {
        return 'recruited_by_you';
    }
    return player?.status;
  };

  const highScoringRecs = recommendations?.recommendations.filter(
    (rec) => rec.suitabilityScore > 40
  );
  const hasHighScoringRecs = highScoringRecs && highScoringRecs.length > 0;
  const playersToShow = hasHighScoringRecs ? highScoringRecs : (recommendations?.recommendations || []).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Scouting</CardTitle>
        <CardDescription>
          Find the best talent for your team using AI recommendations or direct email search.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai-scout">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-scout"><Sparkles className="mr-2" />AI Scout</TabsTrigger>
            <TabsTrigger value="email-search"><Mail className="mr-2" />Search by Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai-scout" className="mt-4">
            <Form {...aiForm}>
              <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-4">
                 <FormField
                  control={aiForm.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Sport</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
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
                              {field.value || "Select or type a sport..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                                placeholder="Search sport..." 
                                value={field.value}
                                onValueChange={field.onChange}
                            />
                            <CommandEmpty>No sport found.</CommandEmpty>
                            <CommandList>
                                <CommandGroup>
                                {sportsList.map((sport) => (
                                    <CommandItem
                                    value={sport.label}
                                    key={sport.value}
                                    onSelect={() => {
                                        aiForm.setValue("sport", sport.label)
                                        setOpen(false)
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        sport.label === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                    />
                                    {sport.label}
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
                <Button type="submit" disabled={isFetchingPlayers || isScouting} className="w-full">
                  {(isFetchingPlayers || isScouting) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2" />}
                  {isFetchingPlayers ? 'Loading Players...' : isScouting ? 'Finding Players...' : 'Find Players'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="email-search" className="mt-4">
             <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="space-y-4">
                 <FormField
                  control={searchForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player's Email</FormLabel>
                      <FormControl>
                        <Input placeholder="player@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSearching} className="w-full">
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2" />}
                  Search Player
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

         <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Results</h3>
            
            {/* AI Scout Results */}
            {isScouting && (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {recommendations?.keyAttributesForSport && (
                <div className="p-3 bg-muted/50 rounded-md mb-4">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2"><ShieldCheck size={16}/> Key Attributes for {aiForm.getValues('sport')}</h4>
                    <div className="flex flex-wrap gap-2">{recommendations.keyAttributesForSport.map(attr => <Badge key={attr} variant="secondary">{attr}</Badge>)}</div>
                </div>
            )}
            {recommendations && playersToShow.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                {playersToShow.map((rec, index) => {
                    const status = getPlayerStatus(rec.playerId);
                    return (
                    <AccordionItem value={`item-${index}`} key={rec.playerId}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-4 w-full"><UserCheck className="text-accent" />
                        <div className="flex-1 text-left">
                            <p className="font-semibold">{rec.playerName}</p>
                            <p className="text-sm text-muted-foreground">Suitability: {rec.suitabilityScore}%</p>
                        </div>
                        {status === 'pending_invite' && (<Badge variant="secondary">Invite Pending</Badge>)}
                        {status === 'recruited' && (<Badge variant="destructive">Recruited by Other</Badge>)}
                        {status === 'recruited_by_you' && (<Badge variant="default">On Your Team</Badge>)}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div><h4 className="font-semibold text-primary mb-1 flex items-center gap-2"><FileText size={16}/> Mini Profile</h4><p className="text-sm text-muted-foreground pl-6">{getPlayerProfile(rec.playerId)}</p></div>
                        <div><h4 className="font-semibold text-primary mb-1">Performance Analysis</h4><p className="text-sm text-muted-foreground">{rec.analysis}</p></div>
                        <div>
                            <h4 className="font-semibold text-primary mb-1 flex items-center gap-2"><Scale size={16}/> Physique Assessment</h4>
                            <p className="text-sm text-muted-foreground mb-2">Score: {rec.physiqueAssessment.score}/100 - {rec.physiqueAssessment.analysis}</p>
                            <Progress value={rec.physiqueAssessment.score} className="h-2 mb-2" />
                        </div>
                        <div><h4 className="font-semibold text-primary mb-1">Scouting Report</h4><p className="text-sm text-muted-foreground">{rec.report}</p></div>
                        <div className="pt-2 border-t">
                        <Button size="sm" className="w-full" onClick={() => handleSendInvite(rec.playerId)} disabled={isSendingInvite === rec.playerId || status !== 'active'}>
                            {isSendingInvite === rec.playerId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {status === 'pending_invite' ? 'Invite Sent' : status === 'recruited' ? 'Unavailable' : status === 'recruited_by_you' ? 'Already on Team' : 'Send Recruit Invite'}
                        </Button>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                )})}
                </Accordion>
            ) : !isScouting && recommendations && (
                <div className="text-center text-muted-foreground py-12">The AI could not find any suitable players based on the current data.</div>
            )}

            {/* Email Search Results */}
            {isSearching && (
                 <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            )}
            {searchedPlayer && (
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarFallback>{searchedPlayer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{searchedPlayer.name}</CardTitle>
                                <CardDescription>{searchedPlayer.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-sm flex items-center gap-2">
                            <span className="font-semibold">Status:</span> 
                            <Badge variant={searchedPlayer.status === 'active' ? 'secondary' : 'default'}>
                                {searchedPlayer.status === 'recruited' && searchedPlayer.coachId === coachId ? 'On Your Team' : searchedPlayer.status.replace('_', ' ')}
                            </Badge>
                        </div>
                         <p className="text-sm"><span className="font-semibold">Goals:</span> {searchedPlayer.goals || 'Not specified'}</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => handleSendInvite(searchedPlayer.id)} disabled={isSendingInvite === searchedPlayer.id || searchedPlayer.status !== 'active'}>
                             {isSendingInvite === searchedPlayer.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {searchedPlayer.status === 'pending_invite' ? 'Invite Sent' : searchedPlayer.status === 'recruited' ? (searchedPlayer.coachId === coachId ? 'Already on Team' : 'Unavailable') : 'Send Recruit Invite'}
                        </Button>
                    </CardFooter>
                 </Card>
            )}
            {searchMessage && (
                <div className="text-center text-muted-foreground py-12 border rounded-lg">
                    <UserX className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Search Complete</h3>
                    <p>{searchMessage}</p>
                </div>
            )}

         </div>
      </CardContent>
    </Card>
  );
}
