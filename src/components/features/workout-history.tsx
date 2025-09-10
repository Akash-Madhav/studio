
"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Dumbbell, Calendar, Info } from "lucide-react";
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
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

export default function WorkoutHistory({ userId }: { userId: string }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        return;
    }
    
    const q = query(
        collection(db, 'workouts'), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

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
        setWorkouts(workoutsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching workout history:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load workout history.",
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

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
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout._id} className="p-4 rounded-lg border flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                    <Dumbbell className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-lg">{workout.exercise}</p>
                    <p className="text-muted-foreground">{formatWorkoutDetails(workout)}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{dayjs(workout.createdAt).format('MMMM D, YYYY')}</span>
                    </div>
                     <p className="text-xs text-muted-foreground/80">{dayjs(workout.createdAt).format('h:mm A')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
