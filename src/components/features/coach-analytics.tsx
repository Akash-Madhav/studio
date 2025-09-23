
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loader2, Info } from "lucide-react";

interface Player {
  id: string;
  name: string;
  physiqueAnalysis?: string;
  recentWorkoutCount?: number;
}

interface CoachAnalyticsProps {
  players: Player[];
  isLoading: boolean;
}

const physiqueChartConfig = {
  score: {
    label: "Physique Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const activityChartConfig = {
  workouts: {
    label: "Recent Workouts",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const parsePhysiqueScore = (physiqueAnalysis?: string): number | null => {
    if (!physiqueAnalysis || physiqueAnalysis === "No physique data available.") {
        return null;
    }
    const match = physiqueAnalysis.match(/Score: (\d+)\/100/);
    return match ? parseInt(match[1], 10) : null;
};

export default function CoachAnalytics({ players, isLoading }: CoachAnalyticsProps) {

    const physiqueChartData = useMemo(() => {
        return players
            .map(player => ({
                name: player.name,
                score: parsePhysiqueScore(player.physiqueAnalysis) || 0,
            }))
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score);
    }, [players]);

    const activityChartData = useMemo(() => {
        return players
            .map(player => ({
                name: player.name,
                workouts: player.recentWorkoutCount || 0,
            }))
            .sort((a, b) => b.workouts - a.workouts);
    }, [players]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (players.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center h-96">
                    <div className="text-center text-muted-foreground py-12 border rounded-lg w-full max-w-sm">
                        <Info className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Player Data</h3>
                        <p>Recruit players to see individual analytics.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {physiqueChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Player Physique Scores</CardTitle>
                        <CardDescription>Comparison of AI-rated physique scores across your players.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={physiqueChartConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={physiqueChartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
            
            {activityChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Player Activity</CardTitle>
                        <CardDescription>Number of workouts logged by each player in the recent period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={activityChartData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                    width={80}
                                />
                                <XAxis type="number" dataKey="workouts" />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                <Bar dataKey="workouts" fill="var(--color-workouts)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
            
             {physiqueChartData.length === 0 && activityChartData.length === 0 && (
                 <Card className="lg:col-span-2">
                    <CardContent className="flex flex-col items-center justify-center h-96">
                        <div className="text-center text-muted-foreground py-12 border rounded-lg w-full max-w-sm">
                            <Info className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Not Enough Data</h3>
                            <p>Analytics will appear here once your players log workouts and physique analyses.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
