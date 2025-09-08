
"use client";

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
import { MessageSquare } from "lucide-react";
  
  const players = [
    {
      id: "player-1",
      name: "Alex Johnson",
      team: "Warriors",
      stats: {
        points: "25.3",
        rebounds: "10.1",
        assists: "4.5",
        status: "Active",
      },
    },
    {
      id: "player-2",
      name: "Maria Garcia",
      team: "Titans",
      stats: {
        points: "18.7",
        rebounds: "5.2",
        assists: "7.8",
        status: "Active",
      },
    },
    {
      id: "player-3",
      name: "Sam Chen",
      team: "Warriors",
      stats: {
        points: "22.1",
        rebounds: "8.9",
        assists: "3.2",
        status: "Injured",
      },
    },
    {
      id: "player-4",
      name: "Emily Rodriguez",
      team: "Titans",
      stats: {
        points: "15.5",
        rebounds: "3.1",
        assists: "9.1",
        status: "Active",
      },
    },
    {
      id: "player-5",
      name: "Ben Carter",
      team: "Warriors",
      stats: {
        points: "12.0",
        rebounds: "12.5",
        assists: "2.1",
        status: "Active",
      },
    },
  ]
  
  export default function PlayerStats() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>
            An overview of your team's player performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Rebounds</TableHead>
                <TableHead className="text-right">Assists</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.team}</TableCell>
                  <TableCell className="text-right">{player.stats.points}</TableCell>
                  <TableCell className="text-right">{player.stats.rebounds}</TableCell>
                  <TableCell className="text-right">{player.stats.assists}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={player.stats.status === 'Active' ? 'default' : 'destructive'}>
                        {player.stats.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                      <Button variant="outline" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contact
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
  
