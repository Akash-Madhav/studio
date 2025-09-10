
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { seedDatabase, getUsersForLogin } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'player' | 'coach';
}

export default function LoginPage() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState("player");
  const [selectedUser, setSelectedUser] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const result = await getUsersForLogin();
    if (result.success && result.users) {
      setAllUsers(result.users as User[]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'Could not load users. You may need to seed the database.',
      });
      setAllUsers([]);
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    const result = await seedDatabase();
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      await fetchUsers(); // Refresh the user list
    } else {
      toast({
        variant: 'destructive',
        title: "Error",
        description: result.message,
      });
    }
    setIsSeeding(false);
  };

  const usersForRole = allUsers.filter(u => u.role === userRole);
  const showSeedButton = !isLoadingUsers && allUsers.length === 0;

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
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              {showSeedButton
                ? "First, seed the database with sample users."
                : "Select a role and user to access your dashboard."
              }
            </CardDescription>
          </CardHeader>
          {showSeedButton ? (
             <CardContent>
                <Button onClick={handleSeedDatabase} disabled={isSeeding} className="w-full">
                    {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Seed Sample Data
                </Button>
             </CardContent>
          ) : (
            <>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>I am a...</Label>
                  <RadioGroup 
                    defaultValue="player" 
                    className="grid grid-cols-2 gap-4"
                    onValueChange={(value) => {
                      setUserRole(value);
                      setSelectedUser("");
                    }}
                  >
                    <div>
                      <RadioGroupItem value="player" id="player" className="peer sr-only" />
                      <Label
                        htmlFor="player"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Player
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="coach" id="coach" className="peer sr-only" />
                      <Label
                        htmlFor="coach"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Coach
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-select">User</Label>
                   <Select onValueChange={setSelectedUser} value={selectedUser} disabled={isLoadingUsers}>
                    <SelectTrigger id="user-select">
                      <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {usersForRole.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Link href={`/dashboard?role=${userRole}&userId=${selectedUser}`} passHref className="w-full">
                  <Button className="w-full" disabled={!selectedUser || isLoadingUsers}>
                    {isLoadingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} OptiFit AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
