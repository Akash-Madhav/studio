
"use client";

import React, { useState, useEffect } from 'react';
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
import { Loader2, Dumbbell, Calendar, Info, User } from "lucide-react";
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUser } from '@/app/actions'; // Import getUser to fetch user details

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

export default function WorkoutHistory({ userId }: { userId: string }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        return;
    }

    async function fetchUser() {
        const userRes = await getUser(userId);
        if (userRes.success && userRes.user) {
            setUser(userRes.user as User);
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Could not load user details." });
        }
    }

    fetchUser();
    
    const q = query(
        collection(db, 'workouts'), 
        where("userId", "==", userId)
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
        
        workoutsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setWorkouts(workoutsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching workout history:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load workout history. You may need to create a Firestore index.",
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
