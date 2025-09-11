
'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
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
  Users,
  MessageSquare,
  UserPlus,
  Mail,
  UsersRound,
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
import PlayerScouting from '@/components/features/player-scouting';
import PlayerStats from '@/components/features/player-stats';
import PendingInvites from '@/components/features/pending-invites';
import PlayerInvites from '@/components/features/player-invites';
import Messages from '@/components/features/messages';
import SportMatch from '@/components/features/sport-match';
import CommunityHub from '@/components/features/community-hub';
import { getAllPlayers, getUsersByIds } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { onSnapshot, collection, query, where, doc, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface User {
    id: string;
    name: string;
    email: string;
    role: 'player' | 'coach';
    dob?: string;
    experience?: string;
    goals?: string;
    status?: string;
}

const formatDate = (date: any): string | null => {
    if (!date) return null;
    try {
        if (date instanceof Timestamp) {
            return date.toDate().toISOString().split('T')[0];
        }
        if (date instanceof Date) {
            return date.toISOString().split('T')[0];
        }
        return new Date(date).toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'player';
  const initialUserId = searchParams.get('userId');
  const isCoach = role === 'coach';
  const initialTab = searchParams.get('tab') || (isCoach ? 'team' : 'dashboard');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  const [players, setPlayers] = useState<any[]>([]);
  const [recruitedPlayers, setRecruitedPlayers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingCoachData, setIsLoadingCoachData] = useState(isCoach);
  
  useEffect(() => {
    if (!initialUserId) {
      setIsLoadingUser(false);
      return;
    }
    
    setIsLoadingUser(true);
    const userRef = doc(db, 'users', initialUserId);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setCurrentUser({
                ...userData,
                id: docSnap.id,
                dob: formatDate(userData.dob),
            } as User);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
            setCurrentUser(null);
        }
        setIsLoadingUser(false);
    }, (error) => {
        console.error("Error fetching user data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch dashboard data.' });
        setIsLoadingUser(false);
    });

    return () => unsubscribe();
  }, [initialUserId, toast]);

  const fetchAllPlayersForScouting = useCallback(async () => {
     if (!isCoach) return;
     try {
        const playersRes = await getAllPlayers();
        if (playersRes.success) {
            setPlayers(playersRes.players);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load players for scouting.'});
        }
     } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch player data for scouting.' });
     }
  }, [isCoach, toast]);
  
  useEffect(() => {
    if (isCoach) {
      fetchAllPlayersForScouting();
    }
  }, [fetchAllPlayersForScouting, isCoach]);

  useEffect(() => {
    if (!isCoach || !initialUserId) {
        setIsLoadingCoachData(false);
        return;
    }
    setIsLoadingCoachData(true);

    // Listener for Recruited Players
    const recruitedQuery = query(collection(db, 'users'), where('coachId', '==', initialUserId), where('status', '==', 'recruited'));
    const recruitedUnsubscribe = onSnapshot(recruitedQuery, async (snapshot) => {
        const recruitedDataPromises = snapshot.docs.map(async (d) => {
            const player: any = { id: d.id, ...d.data() };
            
            const workoutsCollection = collection(db, 'workouts');
            const q = query(workoutsCollection, where("userId", "==", d.id), orderBy('createdAt', 'desc'), where('reps', '!=', null), where('weight', '!=', null));
            const querySnapshot = await getDocs(q);
            const workouts = querySnapshot.docs.map(doc => doc.data());

            let performanceData = 'No recent workouts logged.';
            if (workouts.length > 0) {
                 performanceData = workouts
                    .slice(0, 3)
                    .map(w => `${w.exercise}: ${w.reps || '-'} reps, ${w.weight || '-'} kg`)
                    .join(' | ');
            }
            
            const profileParts = [];
            if (player.experience) profileParts.push(player.experience);
            if (player.goals) profileParts.push(player.goals);
            const userProfile = profileParts.length > 0 ? profileParts.join(', ') : 'No profile information available.';

            return {
                id: d.id,
                name: player.name,
                userProfile: userProfile,
                performanceData: performanceData,
                status: player.status
            };
        });
        const recruitedData = await Promise.all(recruitedDataPromises);
        setRecruitedPlayers(recruitedData);
        setIsLoadingCoachData(false);
    }, (error) => {
        console.error("Error fetching recruited players:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load team data.' });
        setIsLoadingCoachData(false);
    });

    // Listener for Pending Invites
    const invitesQuery = query(collection(db, 'invites'), where('coachId', '==', initialUserId), where('status', '==', 'pending'));
    const invitesUnsubscribe = onSnapshot(invitesQuery, async (snapshot) => {
        const playerIds = snapshot.docs.map(doc => doc.data().playerId);
        
        if (playerIds.length === 0) {
            setPendingInvites([]);
            return;
        }

        const usersRes = await getUsersByIds(playerIds);
        if (usersRes.success) {
            const invitesData = snapshot.docs.map(d => {
                const data = d.data();
                const player = usersRes.users[data.playerId];
                const sentAt = data.sentAt as Timestamp;
                return {
                    inviteId: d.id,
                    playerId: data.playerId,
                    playerName: player?.name || 'Unknown',
                    playerAvatar: `https://picsum.photos/seed/${data.playerId}/50/50`,
                    sentAt: sentAt ? sentAt.toDate().toISOString() : new Date().toISOString(),
                };
            });
            setPendingInvites(invitesData);
        }
    }, (error) => {
        console.error("Error fetching pending invites:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load pending invites.' });
    });

    return () => {
        recruitedUnsubscribe();
        invitesUnsubscribe();
    }
  }, [isCoach, initialUserId, toast]);


  useEffect(() => {
    const tab = searchParams.get('tab') || (isCoach ? 'team' : 'dashboard');
    setActiveTab(tab);
  }, [searchParams, isCoach]);


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
  const userName = currentUser?.name || '';
  const displayName = isCoach ? `Coach ${userName}` : userName;
  
  const updateUrl = (tab: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    newUrl.searchParams.set('userId', initialUserId || '');
    newUrl.searchParams.set('role', role);
    router.push(newUrl.href, { scroll: false });
    setActiveTab(tab);
  };

  const commonPlayerTabs = (
      <>
        <TabsTrigger value="dashboard"><BarChart3 className="mr-2" />Dashboard</TabsTrigger>
        <TabsTrigger value="log-performance"><LogIn className="mr-2" />Log</TabsTrigger>
        <TabsTrigger value="history"><History className="mr-2" />History</TabsTrigger>
        <TabsTrigger value="ai-insights"><BrainCircuit className="mr-2" />Insights</TabsTrigger>
        <TabsTrigger value="recommendations"><Target className="mr-2" />Recs</TabsTrigger>
        <TabsTrigger value="find-sport"><Search className="mr-2" />Find Sport</TabsTrigger>
        <TabsTrigger value="invites"><Mail className="mr-2" />Invites</TabsTrigger>
      </>
  );

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
                    <AvatarImage src={`https://picsum.photos/seed/${initialUserId}/50/50`} alt="@user" data-ai-hint="person face" />
                    <AvatarFallback>{(currentUser?.name || '').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href={`/dashboard/settings?role=${role}&userId=${userId}`}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Settings</DropdownMenuItem>
                 </Link>
                <a href="mailto:support@optifit.ai?subject=OptiFit AI Support Request"><DropdownMenuItem>Support</DropdownMenuItem></a>
                <DropdownMenuSeparator />
                <Link href="/"><DropdownMenuItem>Logout</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {isCoach ? 'Coach Dashboard' : 'Fitness Dashboard'}
          </h1>
          <p className="text-muted-foreground">
             {isCoach
              ? 'Oversee your team, scout new talent, and manage communications.'
              : 'Your central hub for tracking, analyzing, and optimizing your fitness journey.'}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={updateUrl} className="w-full mt-4">
             <TabsList className={`grid w-full h-auto ${isCoach ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-9'}`}>
              {isCoach ? (
                  <>
                      <TabsTrigger value="team"><Users className="mr-2"/>Team</TabsTrigger>
                      <TabsTrigger value="scouting"><UserPlus className="mr-2"/>Scouting</TabsTrigger>
                      <TabsTrigger value="messages"><MessageSquare className="mr-2"/>Messages</TabsTrigger>
                      <TabsTrigger value="community"><UsersRound className="mr-2"/>Community</TabsTrigger>
                  </>
              ) : (
                  <>
                      {commonPlayerTabs}
                      <TabsTrigger value="messages"><MessageSquare className="mr-2"/>Messages</TabsTrigger>
                      <TabsTrigger value="community"><UsersRound className="mr-2"/>Community</TabsTrigger>
                  </>
              )}
            </TabsList>

            {isCoach ? (
                <>
                    <TabsContent value="team" className="mt-4 space-y-8">
                        <PlayerStats players={recruitedPlayers} isLoading={isLoadingCoachData} />
                        <PendingInvites invites={pendingInvites} isLoading={isLoadingCoachData} />
                    </TabsContent>
                    <TabsContent value="scouting" className="mt-4">
                        <PlayerScouting 
                            players={players} 
                            isLoading={isLoadingCoachData} 
                            onInviteSent={fetchAllPlayersForScouting} 
                        />
                    </TabsContent>
                    <TabsContent value="messages" className="mt-4">
                        <Messages userId={userId} />
                    </TabsContent>
                    <TabsContent value="community" className="mt-4">
                        <CommunityHub userId={userId} userName={userName} />
                    </TabsContent>
                </>
            ) : (
                <>
                    <TabsContent value="dashboard" className="mt-4">
                      <ProgressVisualization userId={userId} />
                    </TabsContent>
                     <TabsContent value="log-performance" className="mt-4">
                        <PerformanceLogging userId={userId} onWorkoutLogged={() => {}} />
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
                    <TabsContent value="invites" className="mt-4">
                        <PlayerInvites userId={userId} />
                    </TabsContent>
                    <TabsContent value="messages" className="mt-4">
                        <Messages userId={userId} />
                    </TabsContent>
                     <TabsContent value="community" className="mt-4">
                        <CommunityHub userId={userId} userName={userName} />
                    </TabsContent>
                </>
            )}
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
