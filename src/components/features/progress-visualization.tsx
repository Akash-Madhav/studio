
"use client";

import { useMemo, useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";

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
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Workout {
    _id: string;
    userId: string;
    exercise: string;
    reps?: number;
    weight?: number;
    time?: string;
    distance?: number;
    createdAt: Date;
}

const weightChartConfig = {
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


const cardioChartConfig = {
  minutes: {
    label: "Minutes",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const repsChartConfig = {
  reps: {
    label: "Reps",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function ProgressVisualization({ userId }: { userId: string}) {
    const { toast } = useToast();
    const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'workouts'), where('userId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const workoutsData = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                } as Workout;
            });
            setUserWorkouts(workoutsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching workout history:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load workout history for charts.",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);


    const weightChartData = useMemo(() => {
        const monthlyData: {[key: string]: number} = {};
        userWorkouts.filter(w => w.weight).forEach(w => {
            const month = dayjs(w.createdAt).format('MMMM');
            monthlyData[month] = (monthlyData[month] || 0) + (w.weight! * (w.reps || 1));
        });
        return Object.keys(monthlyData).map(month => ({ month, weight: monthlyData[month]}));
    }, [userWorkouts]);

    const cardioChartData = useMemo(() => {
        const monthlyData: {[key: string]: { totalMinutes: number, count: number }} = {};
        userWorkouts.filter(w => w.time).forEach(w => {
            const month = dayjs(w.createdAt).format('MMMM');
            const [minutes] = (w.time || "0:0").split(':').map(Number);
            if (!monthlyData[month]) {
                monthlyData[month] = { totalMinutes: 0, count: 0};
            }
            monthlyData[month].totalMinutes += minutes;
            monthlyData[month].count++;
        });

        return Object.keys(monthlyData).map(month => ({ month, minutes: Math.round(monthlyData[month].totalMinutes / monthlyData[month].count) }));
    }, [userWorkouts]);

    const repsChartData = useMemo(() => {
        const maxReps: {[key: string]: number} = {};
        userWorkouts.filter(w => w.reps).forEach(w => {
            maxReps[w.exercise] = Math.max(maxReps[w.exercise] || 0, w.reps!);
        });
        return Object.keys(maxReps).map(exercise => ({ exercise, reps: maxReps[exercise]}));
    }, [userWorkouts]);
    
    if (isLoading) {
        return (
             <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (userWorkouts.length === 0) {
        return (
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center h-96">
                    <div className="text-center text-muted-foreground py-12 border rounded-lg w-full max-w-sm">
                        <Info className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Progress to Show Yet</h3>
                        <p>Use the "Log" tab to record a workout.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
     {weightChartData.length > 0 && <Card>
        <CardHeader>
          <CardTitle>Weight Lifted Progress</CardTitle>
          <CardDescription>Total weight lifted per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={weightChartConfig}>
            <BarChart accessibilityLayer data={weightChartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="weight" fill="var(--color-weight)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>}
     {cardioChartData.length > 0 && <Card>
        <CardHeader>
          <CardTitle>Cardio Duration</CardTitle>
          <CardDescription>Average cardio duration per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cardioChartConfig}>
            <LineChart
              accessibilityLayer
              data={cardioChartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="minutes"
                type="natural"
                stroke="var(--color-minutes)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>}
      {repsChartData.length > 0 && <Card>
        <CardHeader>
          <CardTitle>Max Reps per Exercise</CardTitle>
          <CardDescription>Your personal bests</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={repsChartConfig}>
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={repsChartData}
              margin={{ left: 10 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="exercise"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="w-20"
                width={80}
              />
              <XAxis dataKey="reps" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="reps" fill="var(--color-reps)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>}
    </div>
  );
}
