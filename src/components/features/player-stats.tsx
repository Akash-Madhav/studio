
"use client";

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Loader2, User, UserCheck, Eye, Sparkles, History, Dumbbell, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { getPlayerAnalysis, PlayerAnalysisOutput } from '@/ai/flows/player-analysis-flow';
import { getWorkoutHistory } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import { ScrollArea } from '../ui/scroll-area';
  
interface Player {
  id: string;
  name: string;
  userProfile: string;
  performanceData: string;
  status: string;
}

interface Workout {
    _id: string;
    exercise: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    createdAt: Date;
}

interface PlayerStatsProps {
    players: Player[];
    isLoading: boolean;
}

export default function PlayerStats({ players, isLoading }: PlayerStatsProps) {
    const [isAnalyzing, setIsAnalyzing] = React.useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = React.useState<PlayerAnalysisOutput | null>(null);
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const [historyPlayer, setHistoryPlayer] = React.useState<Player | null>(null);
    const [workoutHistory, setWorkoutHistory] = React.useState<Workout[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
    
    const { toast } = useToast();

    const handleAnalyzePlayer = async (player: Player) => {
        setIsAnalyzing(player.id);
        setSelectedPlayer(player);
        try {
            const result = await getPlayerAnalysis({
                playerName: player.name,
                userProfile: player.userProfile,
                performanceData: player.performanceData,
            });
            setAnalysisResult(result);
        } catch (error) {
            console.error("Failed to get player analysis:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not generate AI analysis for this player. Please try again.',
            });
            setSelectedPlayer(null); // Close dialog on error
        } finally {
            setIsAnalyzing(null);
        }
    };

    const handleViewHistory = async (player: Player) => {
        setHistoryPlayer(player);
        setIsLoadingHistory(true);
        const result = await getWorkoutHistory(player.id);
        if (result.success) {
            setWorkoutHistory(result.workouts as Workout[]);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch workout history.',
            });
        }
        setIsLoadingHistory(false);
    };

    const formatWorkoutDetails = (workout: Workout) => {
        const details = [];
        if (workout.reps) details.push(`${workout.reps} reps`);
        if (workout.weight) details.push(`${workout.weight} kg`);
        if (workout.distance) details.push(`${workout.distance} km`);
        if (workout.time) details.push(`${workout.time}`);
        return details.join(' · ');
    };


    const closeAnalysisDialog = () => {
        setAnalysisResult(null);
        setSelectedPlayer(null);
    };
    
    const closeHistoryDialog = () => {
        setHistoryPlayer(null);
        setWorkoutHistory([]);
    };

    return (
        <>
            <Card className="border-0 shadow-none">
                <CardHeader className="px-0">
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck /> Your Recruited Players
                    </CardTitle>
                    <CardDescription>
                        An overview of your team's player performance. Get an AI analysis or view their workout history.
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
                                         <Dialog onOpenChange={(open) => !open && closeHistoryDialog()}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => handleViewHistory(player)}>
                                                    <History className="mr-2 h-4 w-4" />
                                                    History
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Workout History: {historyPlayer?.name}</DialogTitle>
                                                    <DialogDescription>
                                                        A log of all recorded training sessions.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-96 pr-4">
                                                    {isLoadingHistory ? (
                                                        <div className="flex justify-center items-center h-full">
                                                            <Loader2 className="animate-spin" />
                                                        </div>
                                                    ) : workoutHistory.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {workoutHistory.map((workout) => (
                                                                <div key={workout._id} className="flex items-start gap-3">
                                                                     <div className="bg-primary/10 text-primary p-2 rounded-full mt-1">
                                                                        <Dumbbell className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="font-semibold">{workout.exercise}</p>
                                                                        <p className="text-sm text-muted-foreground">{formatWorkoutDetails(workout)}</p>
                                                                         <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mt-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{dayjs(workout.createdAt).format('MMMM D, YYYY h:mm A')}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-muted-foreground py-12">
                                                            No workouts logged yet.
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>

                                        <Button variant="secondary" size="sm" onClick={() => handleAnalyzePlayer(player)} disabled={!!isAnalyzing}>
                                            {isAnalyzing === player.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                            AI Analysis
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!analysisResult && !!selectedPlayer} onOpenChange={(open) => !open && closeAnalysisDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>AI Analysis: {selectedPlayer?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            A high-level performance overview generated by AI.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {analysisResult && (
                       <div className="text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div>
                                <h3 className="font-semibold text-primary mb-1">Summary</h3>
                                <p className="text-muted-foreground">{analysisResult.summary}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary mb-1">Strengths</h3>
                                <p className="text-muted-foreground">{analysisResult.strengths}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary mb-1">Areas for Improvement</h3>
                                <p className="text-muted-foreground">{analysisResult.areasForImprovement}</p>
                            </div>
                       </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeAnalysisDialog}>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
  }

    