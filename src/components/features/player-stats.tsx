
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, BarChart3 } from "lucide-react";
import { getPlayersForScouting } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
  
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
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>
            An overview of your team's player performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Profile</TableHead>
                            <TableHead>Latest Performance</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {players.map((player) => (
                            <TableRow key={player.id}>
                            <TableCell className="font-medium whitespace-nowrap">{player.name}</TableCell>
                            <TableCell>{player.userProfile}</TableCell>
                            <TableCell className="max-w-xs truncate">{player.performanceData || 'N/A'}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={'default'}>
                                    Active
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center space-x-2 whitespace-nowrap">
                                <Button variant="outline" size="sm" onClick={() => onViewPlayerDashboard(player.id)}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Dashboard
                                </Button>
                                <Link href={`/dashboard?role=coach&userId=${userId}&tab=messages&conversationId=${getConversationId(userId, player.id)}`}>
                                    <Button variant="outline" size="sm">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Contact
                                    </Button>
                                </Link>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    )
  }
