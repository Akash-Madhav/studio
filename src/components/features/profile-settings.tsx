
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile, getUser } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  dob: z.date().optional().nullable(),
  experience: z.string().optional(),
  goals: z.string().optional(),
});

interface ProfileSettingsProps {
    userId: string;
    role: string;
}

export default function ProfileSettings({ userId, role }: ProfileSettingsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [workoutSummary, setWorkoutSummary] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dob: undefined,
      experience: "",
      goals: "",
    },
  });

  useEffect(() => {
    async function fetchUser() {
      setIsFetchingUser(true);
      const result = await getUser(userId);
      if (result.success && result.user) {
        form.reset({
          name: result.user.name || "",
          dob: result.user.dob ? new Date(result.user.dob) : undefined,
          experience: result.user.experience || "",
          goals: result.user.goals || "",
        });
        setUserEmail(result.user.email || "");
        setUserName(result.user.name || "");
        setWorkoutSummary(result.user.workoutSummary || null);
      } else {
        toast({ variant: 'destructive', title: "Error", description: "Failed to load user profile." });
      }
      setIsFetchingUser(false);
    }
    if (userId) {
      fetchUser();
    }
  }, [userId, form, toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const result = await updateUserProfile({ 
        userId,
        name: values.name,
        experience: values.experience,
        goals: values.goals,
        dob: values.dob ? values.dob.toISOString().split('T')[0] : null,
    });

    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      router.push(`/dashboard?role=${role}&userId=${userId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }

  if (isFetchingUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Loading your profile...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information and goals.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-4xl">
                        {(userName || '').charAt(0).toUpperCase()}
                      </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                      <h2 className="text-2xl font-bold">{userName}</h2>
                      <p className="text-muted-foreground">{userEmail}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                              <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                             <Calendar
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={new Date().getFullYear()}
                                  mode="single"
                                  selected={field.value ?? undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                              />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Beginner, Intermediate" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitness Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your fitness goals..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fitness Accomplishment Summary</CardTitle>
          <CardDescription>
            An AI-powered summary of your workout history, updated automatically after each session.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {workoutSummary ? (
                <ScrollArea className="h-96 pr-4">
                    <div className="p-4 bg-muted/50 rounded-md whitespace-pre-line text-sm leading-relaxed">
                        {workoutSummary}
                    </div>
                </ScrollArea>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    Your summary will appear here after you log your first workout.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
