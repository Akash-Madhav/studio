
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, User } from "lucide-react";
import { getPlayersForScouting } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProgressVisualization from "./progress-visualization";
  
interface Player {
  id: string;
  name: string;
  userProfile: string;
  performanceData: string;
}

interface PlayerStatsProps {
    userId: string;
    onViewPlayerDashboard: (playerId: string) => void;
}

export default function PlayerStats({ userId, onViewPlayerDashboard }: PlayerStatsProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
      async function fetchPlayers() {
        setIsLoading(true);
        const result = await getPlayersForScouting();
        if (result.success && result.players) {
            setPlayers(result.players);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch players.'
            })
        }
        setIsLoading(false);
      }
      fetchPlayers();
    }, [toast]);
    
    const getConversationId = (coachId: string, playerId: string) => {
        return [coachId, playerId].sort().join('_');
    }

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>
                    An overview of your team's player performance. Click a player's dashboard to see their progress.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 border rounded-lg">
                        <User className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Players Found</h3>
                        <p>New players will appear here once they log a workout.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {players.map((player) => (
                             <Dialog key={player.id}>
                                <Card className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={`https://picsum.photos/seed/${player.id}/100/100`} data-ai-hint="person face" />
                                                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{player.name}</CardTitle>
                                                <CardDescription>{player.userProfile}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-2">
                                        <p className="text-sm font-medium">Latest Performance</p>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{player.performanceData || 'N/A'}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 pt-4">
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M3 3v18h18"/></svg>
                                                Dashboard
                                            </Button>
                                        </DialogTrigger>
                                        <Link href={`/dashboard?role=coach&userId=${userId}&conversationId=${getConversationId(userId, player.id)}`} legacyBehavior>
                                             <a onClick={(e) => {
                                                e.preventDefault();
                                                const url = `/dashboard?role=coach&userId=${userId}&tab=messages&conversationId=${getConversationId(userId, player.id)}`;
                                                window.history.pushState({}, '', url);
                                                // This is a bit of a hack to force re-render with new query params
                                                window.dispatchEvent(new PopStateEvent('popstate'));
                                            }}>
                                                <Button variant="default" size="sm" asChild>
                                                    <div>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                         Contact
                                                    </div>
                                                </Button>
                                            </a>
                                        </Link>
                                    </CardFooter>
                                </Card>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>{player.name}'s Dashboard</DialogTitle>
                                        <DialogDescription>
                                            A visualization of {player.name}'s recent performance data.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <ProgressVisualization userId={player.id} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
  }
