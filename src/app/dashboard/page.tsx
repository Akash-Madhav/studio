
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  BrainCircuit,
  Dumbbell,
  FileText,
  Search,
  Target,
  History,
  Users,
  MessageSquare,
  UserPlus,
  Mail,
  UsersRound,
  Scan,
  Bot,
  ScrollText,
  ChevronDown,
  Home as HomeIcon,
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
import WorkoutAnalysis from "@/components/features/workout-analysis";
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
import { onSnapshot, collection, query, where, doc, getDoc, Timestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PhysiqueRater from '@/components/features/physique-rater';
import PhysiqueHistory from '@/components/features/physique-history';
import WorkoutAccomplishmentSummary from '@/components/features/workout-accomplishment-summary';
import HomeWorkoutLog from '@/components/features/home-workout-log';


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

function HomeDashboard({ userId, workouts, isLoadingHistory }: { userId: string, workouts: Workout[], isLoadingHistory: boolean }) {
  return (
    <div className="space-y-8">
      <ProgressVisualization 
        workouts={workouts} 
        isLoading={isLoadingHistory} 
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <HomeWorkoutLog userId={userId} onWorkoutLogged={() => {}}/>
        </div>
        <div className="lg:col-span-2">
           <WorkoutAccomplishmentSummary 
              userId={userId} 
              workouts={workouts}
              isLoading={isLoadingHistory}
            />
        </div>
      </div>
    </div>
  )
}


function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'player';
  const initialUserId = searchParams.get('userId');
  const isCoach = role === 'coach';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const initialTab = searchParams.get('tab') || (isCoach ? 'team' : 'home');
  const [activeTab, setActiveTab] = useState(initialTab);

  const [players, setPlayers] = useState<any[]>([]);
  const [recruitedPlayers, setRecruitedPlayers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingCoachData, setIsLoadingCoachData] = useState(isCoach);

  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(!isCoach);
  
  useEffect(() => {
    if (!initialUserId) {
      setIsLoading(false);
      router.push('/');
      return;
    }

    // Listener for current user data
    const userRef = doc(db, "users", initialUserId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setCurrentUser({ id: doc.id, ...doc.data() } as User);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
            router.push('/');
        }
        setIsLoading(false);
    });
    
    // Listener for workout history for players
    let unsubscribeWorkouts = () => {};
    if (role === 'player') {
        setIsLoadingHistory(true);
        const workoutsQuery = query(collection(db, 'users', initialUserId, 'workouts'), orderBy("createdAt", "desc"));
        unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
            const history = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    ...data,
                    _id: doc.id,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                } as Workout;
            });
            setWorkoutHistory(history);
            setIsLoadingHistory(false);
        }, (error) => {
            console.error("Error fetching workout history:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load workout history.' });
            setIsLoadingHistory(false);
        });
    }

    return () => {
      unsubscribeUser();
      unsubscribeWorkouts();
    }
  }, [initialUserId, role, toast, router]);

  const fetchAllPlayersForScouting = async () => {
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
  };
  
  useEffect(() => {
    if (isCoach) {
      fetchAllPlayersForScouting();
    }
  }, [isCoach]);

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
            
            const workoutsCollection = collection(db, 'users', d.id, 'workouts');
            const q = query(workoutsCollection, orderBy("createdAt", "desc"), limit(3));
            const querySnapshot = await getDocs(q);
            
            const recentWorkouts = querySnapshot.docs.map(doc => ({ ...doc.data(), createdAt: (doc.data().createdAt as Timestamp).toDate() }));

            let performanceData = 'No recent workouts logged.';
            if (recentWorkouts.length > 0) {
                 performanceData = recentWorkouts
                    .map(w => {
                        const parts = [w.exercise];
                        if (w.reps) parts.push(`${w.reps} reps`);
                        if (w.weight) parts.push(`@ ${w.weight}kg`);
                        if (w.distance) parts.push(`${w.distance}km`);
                        if (w.time) parts.push(`in ${w.time}`);
                        return parts.join(' ');
                    }).join('; ');
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
                status: player.status,
                coachId: player.coachId
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
    const tab = searchParams.get('tab') || (isCoach ? 'team' : 'home');
    setActiveTab(tab);
  }, [searchParams, isCoach]);


  if (isLoading) {
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
    router.push(newUrl.href, { scroll: false });
    setActiveTab(tab);
  };

  const coachTabs = [
    { value: 'team', label: 'Team', icon: Users },
    { value: 'scouting', label: 'Scouting', icon: UserPlus },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'community', label: 'Community', icon: UsersRound },
  ];
  const playerTabs = [
      { value: 'home', label: 'Home', icon: HomeIcon },
      { value: 'history', label: 'History', icon: History },
      { value: 'analysis', label: 'Analysis', icon: Bot },
      { value: 'ai-insights', label: 'Insights', icon: BrainCircuit },
      { value: 'recommendations', label: 'Recs', icon: Target },
      { value: 'physique', label: 'Physique', icon: Scan },
      { value: 'find-sport', label: 'Find Sport', icon: Search },
      { value: 'invites', label: 'Invites', icon: Mail },
      { value: 'messages', label: 'Messages', icon: MessageSquare },
      { value: 'community', label: 'Community', icon: UsersRound },
  ];

  const menuItems = isCoach ? coachTabs : playerTabs;


  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Features <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {menuItems.map(item => (
                        <DropdownMenuItem key={item.value} onSelect={() => updateUrl(item.value)}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="hidden sm:inline-block text-sm font-medium text-right">{displayName}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar>
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
                      <TabsContent value="home" className="mt-4">
                        <HomeDashboard 
                          userId={userId}
                          workouts={workoutHistory} 
                          isLoadingHistory={isLoadingHistory} 
                        />
                      </TabsContent>
                      <TabsContent value="analysis" className="mt-4">
                          <WorkoutAnalysis userId={userId} />
                      </TabsContent>
                      <TabsContent value="history" className="mt-4">
                          <WorkoutHistory 
                            workouts={workoutHistory} 
                            isLoading={isLoadingHistory}
                            user={currentUser}
                          />
                      </TabsContent>
                      <TabsContent value="ai-insights" className="mt-4">
                          <AiInsights userId={userId} />
                      </TabsContent>
                      <TabsContent value="recommendations" className="mt-4">
                          <PersonalizedRecommendations 
                            userId={userId} 
                            workouts={workoutHistory}
                            isLoading={isLoadingHistory}
                          />
                      </TabsContent>
                      <TabsContent value="physique" className="mt-4">
                          <div className="grid lg:grid-cols-2 gap-8">
                              <PhysiqueRater userId={userId}/>
                              <PhysiqueHistory userId={userId} />
                          </div>
                      </TabsContent>
                      <TabsContent value="find-sport" className="mt-4">
                          <SportMatch 
                            userId={userId} 
                            workouts={workoutHistory}
                            isLoading={isLoadingHistory}
                          />
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
    </Suspense>
  );
}

export default function Dashboard() {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
        <DashboardContent />
      </Suspense>
    );
  }
