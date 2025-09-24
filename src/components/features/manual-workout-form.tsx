
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { logWorkout } from "@/app/actions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
});

interface ManualWorkoutFormProps {
    userId?: string;
    onWorkoutLogged: () => void;
}

export default function ManualWorkoutForm({ userId, onWorkoutLogged }: ManualWorkoutFormProps) {
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exercise: "",
      reps: '' as unknown as undefined,
      weight: '' as unknown as undefined,
      time: "",
      distance: '' as unknown as undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to log a workout.",
        });
        return;
    }
    setIsLogging(true);
    const result = await logWorkout({ ...values, userId });
    setIsLogging(false);

    if (result.success) {
      toast({
        title: "Workout Logged!",
        description: result.message,
      });
      form.reset();
      onWorkoutLogged();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Log a Workout Manually</CardTitle>
        <CardDescription>
          Add an exercise to your history.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="exercise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bench Press" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reps</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Distance (km)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., 25:30" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLogging} className="w-full">
              {isLogging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to History
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
