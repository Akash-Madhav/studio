
"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Info, User } from "lucide-react";
import dayjs from 'dayjs';

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

interface User {
    id: string;
    name: string;
    email: string;
}

interface WorkoutHistoryProps {
  workouts: Workout[];
  isLoading: boolean;
  user: User | null;
}

export default function WorkoutHistory({ workouts, isLoading, user }: WorkoutHistoryProps) {
  const formatWorkoutDetails = (workout: Workout) => {
    const details = [];
    if (workout.reps) details.push(`${workout.reps} reps`);
    if (workout.weight) details.push(`${workout.weight} kg`);
    if (workout.distance) details.push(`${workout.distance} km`);
    if (workout.time) details.push(`${workout.time}`);
    return details.join(' · ');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Workout History</CardTitle>
        <CardDescription>A log of all your past training sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : workouts.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border rounded-lg">
                <Info className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No Workouts Logged</h3>
                <p>Use the "Log" tab to record your first workout.</p>
            </div>
        ) : (
          <div>
            {user && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-muted/50 border">
                    <User className="h-5 w-5 text-muted-foreground"/>
                    <span className="font-mono text-sm">{user.email}</span>
                </div>
            )}
            <Table>
                <TableCaption>A list of your recent workouts.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Exercise</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {workouts.map((workout) => (
                    <TableRow key={workout._id}>
                        <TableCell className="font-medium">{workout.exercise}</TableCell>
                        <TableCell>{formatWorkoutDetails(workout)}</TableCell>
                        <TableCell className="text-right">{dayjs(workout.createdAt).format('MMMM D, YYYY')}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    