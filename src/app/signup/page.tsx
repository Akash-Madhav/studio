
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { signUpWithEmailAndPassword, signInWithGoogle } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["player", "coach"], {
    required_error: "You need to select a role.",
  }),
});

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "player",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    let createdUserId: string | null = null;

    try {
        // Step 1: Create user on the client-side with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        createdUserId = user.uid;

        // Step 2: Call server action to create the user profile in Firestore
        const serverResult = await signUpWithEmailAndPassword({
            userId: user.uid,
            name: values.name,
            email: values.email,
            role: values.role,
        });

        if (serverResult.success) {
            toast({
                title: "Account Created",
                description: "Welcome to OptiFit AI! Redirecting you...",
            });
            router.push(`/dashboard?role=${serverResult.role}&userId=${serverResult.userId}`);
        } else {
            // This will trigger the catch block below
            throw new Error(serverResult.message);
        }
    } catch (error: any) {
        // This unified catch block handles failures from both client and server steps
        let errorMessage = "Could not create account.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: errorMessage,
        });
        
        // Clean up: If the user was created in Auth but the DB record failed,
        // we should sign them out to prevent a broken login state.
        if (createdUserId) {
            await signOut(auth);
        }
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleGoogleSignIn = async (role: 'player' | 'coach') => {
    setIsGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const serverResult = await signInWithGoogle({
            userId: user.uid,
            email: user.email!,
            name: user.displayName!,
            role: role,
        });

        if (serverResult.success) {
            toast({
                title: "Account Created",
                description: "Welcome! Redirecting you to the dashboard...",
            });
            router.push(`/dashboard?role=${serverResult.role}&userId=${serverResult.userId}`);
        } else {
            throw new Error(serverResult.message || "An unknown error occurred during Google sign-in.");
        }
    } catch (error: any) {
        let errorMessage = "Failed to sign up with Google.";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Sign-up process was cancelled.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        toast({
            variant: "destructive",
            title: "Google Sign-Up Failed",
            description: errorMessage,
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Dumbbell className="w-6 h-6" />
          <span className="font-bold">OptiFit AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>
                  Create your OptiFit AI account to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                 <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                          disabled={isLoading || isGoogleLoading}
                        >
                          <FormItem>
                             <RadioGroupItem value="player" id="player" className="peer sr-only" />
                              <Label
                                htmlFor="player"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                Player
                              </Label>
                          </FormItem>
                          <FormItem>
                            <RadioGroupItem value="coach" id="coach" className="peer sr-only" />
                              <Label
                                htmlFor="coach"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                Coach
                              </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                        Sign up with email
                        </span>
                    </div>
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => handleGoogleSignIn(form.getValues('role'))} disabled={isLoading || isGoogleLoading} type="button">
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.4 56.2L384.9 128C349.5 95.7 300.7 80 248 80c-82.6 0-150.2 67.6-150.2 150.2S165.4 406.4 248 406.4c93.2 0 128.3-61.1 133.7-93.5H248v-63.4h239.2c1.2 12.3 1.8 24.9 1.8 38.8z"></path></svg>}
                    Sign up with Google
                </Button>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Alex Johnson" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="m@example.com" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading || isGoogleLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/" className="underline">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}

    