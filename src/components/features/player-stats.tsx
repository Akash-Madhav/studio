
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Loader2, User, BarChart3, UserCheck, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  
interface Player {
  id: string;
  name: string;
  userProfile: string;
  performanceData: string;
  status: string;
}

interface PlayerStatsProps {
    players: Player[];
    isLoading: boolean;
    onViewPlayerDashboard: (playerId: string) => void;
}

export default function PlayerStats({ players, isLoading, onViewPlayerDashboard }: PlayerStatsProps) {
    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                    <UserCheck /> Your Recruited Players
                </CardTitle>
                <CardDescription>
                    An overview of your team's player performance. Click a player to see their progress dashboard.
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
                        <h3 className="mt-4 text-lg font-semibold">No Players on Roster</h3>
                        <p>Use the "Scouting" tab to find and recruit new players to your team.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {players.map((player) => (
                            <Card key={player.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={`https://picsum.photos/seed/${player.id}/100/100`} data-ai-hint="person face" />
                                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{player.name}</CardTitle>
                                            <CardDescription>{player.userProfile.split(',').slice(0,2).join(', ')}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                    <p className="text-sm font-medium">Latest Performance</p>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{player.performanceData || 'N/A'}</p>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" size="sm" onClick={() => onViewPlayerDashboard(player.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Dashboard
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
  }
