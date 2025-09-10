
'use client';

import React, { Suspense, useState, useEffect, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  BrainCircuit,
  Dumbbell,
  LogIn,
  Search,
  Target,
  History,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiInsights from "@/components/features/ai-insights";
import PerformanceLogging from "@/components/features/performance-logging";
import PersonalizedRecommendations from "@/components/features/personalized-recommendations";
import ProgressVisualization from "@/components/features/progress-visualization";
import WorkoutHistory from '@/components/features/workout-history';
import { getUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import SportMatch from '@/components/features/sport-match';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'player' | 'coach';
    dob?: Date;
    experience?: string;
    goals?: string;
    status?: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'player';
  const initialUserId = searchParams.get('userId');
  const isCoach = role === 'coach';
  const initialTab = searchParams.get('tab') || 'dashboard';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPending, startTransition] = useTransition();

  const fetchUserData = useCallback(async () => {
    if (!initialUserId) {
      setIsLoadingUser(false);
      return;
    };
    
    setIsLoadingUser(true);

    startTransition(async () => {
        try {
            const userResult = await getUser(initialUserId);
            if (userResult.success && userResult.user) {
                setCurrentUser(userResult.user as User);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: userResult.message || 'Could not load user data.' });
                setCurrentUser(null);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch dashboard data.' });
        } finally {
            setIsLoadingUser(false);
        }
    });
  }, [initialUserId, toast]);
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);


  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    setActiveTab(tab);
  }, [searchParams]);


  if (isLoadingUser) {
    return (
        <div className="flex flex-col min-h-screen w-full">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Dumbbell className="h-6 w-6" />
                    <span className="font-bold">OptiFit AI</span>
                </div>
                 <div className="ml-auto flex items-center gap-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96 mb-8" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </main>
        </div>
    )
  }

  if (!currentUser) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <p className="text-destructive">User not found or not logged in.</p>
            <Link href="/" passHref>
                <Button variant="link">Return to Login</Button>
            </Link>
        </div>
    )
  }

  const userId = initialUserId || '';
  const dashboardIsCoachView = isCoach;
  
  const userName = currentUser?.name || '';
  const displayName = isCoach ? `Coach ${userName}` : userName;
  
  const updateUrl = (tab: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    newUrl.searchParams.set('userId', initialUserId || '');
    newUrl.searchParams.set('role', role);
    router.push(newUrl.href);
    setActiveTab(tab);
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Dumbbell className="h-6 w-6" />
          <span className="font-bold">OptiFit AI</span>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial"></div>
          <div className="flex items-center gap-3">
             <ThemeToggle />
             <span className="hidden sm:inline-block text-sm font-medium text-right">{displayName}</span>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={`https://picsum.photos/seed/${initialUserId}/50/50`}
                      alt="@user"
                      width={50}
                      height={50}
                      data-ai-hint="person face"
                    />
                    <AvatarFallback>{(currentUser?.name || '').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href={`/dashboard/settings?role=${role}&userId=${userId}`}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Settings
                    </DropdownMenuItem>
                 </Link>
                <a href="mailto:support@optifit.ai?subject=OptiFit AI Support Request">
                    <DropdownMenuItem>
                        Support
                    </DropdownMenuItem>
                </a>
                <DropdownMenuSeparator />
                <Link href="/">
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {dashboardIsCoachView ? 'Coach Dashboard' : 'Fitness Dashboard'}
          </h1>
          <p className="text-muted-foreground">
             {dashboardIsCoachView
              ? 'Your central hub for tracking your personal progress.'
              : 'Your central hub for tracking, analyzing, and optimizing your fitness journey.'}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={updateUrl} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-6 h-auto">
              <TabsTrigger value="dashboard">
                <BarChart3 className="mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="log-performance">
                <LogIn className="mr-2" />
                Log
              </TabsTrigger>
              <TabsTrigger value="history">
                  <History className="mr-2" />
                  History
              </TabsTrigger>
              <TabsTrigger value="ai-insights">
                <BrainCircuit className="mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <Target className="mr-2" />
                Recs
              </TabsTrigger>
              <TabsTrigger value="find-sport">
                <Search className="mr-2" />
                Find Sport
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4">
              <ProgressVisualization userId={userId} />
            </TabsContent>
             <TabsContent value="log-performance" className="mt-4">
                <PerformanceLogging userId={userId} onWorkoutLogged={fetchUserData} />
            </TabsContent>
             <TabsContent value="history" className="mt-4">
                <WorkoutHistory userId={userId} />
            </TabsContent>
            <TabsContent value="ai-insights" className="mt-4">
                <AiInsights userId={userId} />
            </TabsContent>
            <TabsContent value="recommendations" className="mt-4">
                <PersonalizedRecommendations userId={userId} />
            </TabsContent>
            <TabsContent value="find-sport" className="mt-4">
                <SportMatch userId={userId} />
            </TabsContent>
          </Tabs>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
