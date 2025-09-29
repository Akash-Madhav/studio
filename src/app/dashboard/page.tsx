
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BrainCircuit,
  Dumbbell,
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
  MoreVertical,
  Home as HomeIcon,
  LineChart,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getAllPlayers, getPlayersForCoach, getUsersByIds } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { onSnapshot, collection, query, where, doc, Timestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PhysiqueRater from '@/components/features/physique-rater';
import PhysiqueHistory from '@/components/features/physique-history';
import CoachAnalytics from '@/components/features/coach-analytics';
import WorkoutSummary from '@/components/features/workout-accomplishment-summary';


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

interface PhysiqueAnalysis {
    id: string;
    summary: string;
    rating: { score: number; justification: string };
    createdAt: Date;
}

function HomeDashboard({ 
    userId, 
    workouts, 
    isLoadingHistory, 
    physiqueHistory, 
    isLoadingPhysique 
}: { 
    userId: string, 
    workouts: Workout[], 
    isLoadingHistory: boolean,
    physiqueHistory: PhysiqueAnalysis[],
    isLoadingPhysique: boolean,
}) {
  return (
    <div className="space-y-8">
        <WorkoutSummary 
            userId={userId} 
            workouts={workouts} 
            physiqueHistory={physiqueHistory}
            isLoading={isLoadingHistory || isLoadingPhysique}
        />
        <ProgressVisualization 
            workouts={workouts} 
            isLoading={isLoadingHistory} 
        />
    </div>
  )
}

const coachTabs = [
  { value: 'team', label: 'Team', icon: Users },
  { value: 'analytics', label: 'Analytics', icon: LineChart },
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

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'player';
  const initialUserId = searchParams.get('userId');
  const isCoach = role === 'coach';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const activeTab = useMemo(() => {
    return searchParams.get('tab') || (isCoach ? 'team' : 'home');
  }, [searchParams, isCoach]);

  const [players, setPlayers] = useState<any[]>([]);
  const [recruitedPlayers, setRecruitedPlayers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingCoachData, setIsLoadingCoachData] = useState(isCoach);

  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(!isCoach);
  const [physiqueHistory, setPhysiqueHistory] = useState<PhysiqueAnalysis[]>([]);
  const [isLoadingPhysique, setIsLoadingPhysique] = useState(!isCoach);

  
  useEffect(() => {
    if (!initialUserId) {
      setIsLoading(false);
      router.push('/login');
      return;
    }

    const userRef = doc(db, "users", initialUserId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setCurrentUser({ id: doc.id, ...doc.data() } as User);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
            router.push('/login');
        }
        setIsLoading(false);
    });
    
    let unsubscribeWorkouts = () => {};
    let unsubscribePhysique = () => {};

    if (role === 'player') {
        setIsLoadingHistory(true);
        const workoutsQuery = query(collection(db, 'users', initialUserId, 'workouts'), orderBy("createdAt", "desc"));
        unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
            const history = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return { ...data, _id: doc.id, createdAt: createdAt ? createdAt.toDate() : new Date() } as Workout;
            });
            setWorkoutHistory(history);
            setIsLoadingHistory(false);
        }, (error) => {
            console.error("Error fetching workout history:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load workout history.' });
            setIsLoadingHistory(false);
        });

        setIsLoadingPhysique(true);
        const physiqueQuery = query(collection(db, 'users', initialUserId, 'physique_analyses'), orderBy("createdAt", "desc"));
        unsubscribePhysique = onSnapshot(physiqueQuery, (snapshot) => {
             const history = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return { ...data, id: doc.id, createdAt: createdAt ? createdAt.toDate() : new Date() } as PhysiqueAnalysis;
            });
            setPhysiqueHistory(history);
            setIsLoadingPhysique(false);
        }, (error) => {
            console.error("Error fetching physique history:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load physique history.' });
            setIsLoadingPhysique(false);
        });
    }

    return () => {
      unsubscribeUser();
      unsubscribeWorkouts();
      unsubscribePhysique();
    }
  }, [initialUserId, role, toast, router]);
  
  const fetchCoachData = async () => {
    if (!isCoach || !initialUserId) return;
    setIsLoadingCoachData(true);
    try {
        const res = await getPlayersForCoach(initialUserId);
        if (res.success) {
            setPlayers(res.scoutingPlayers || []);
            setRecruitedPlayers(res.recruitedPlayers || []);
            setPendingInvites(res.pendingInvites || []);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.message || 'Could not load coach data.' });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch coach data.' });
    } finally {
        setIsLoadingCoachData(false);
    }
  };

  useEffect(() => {
      fetchCoachData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, initialUserId]);

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
            <Link href="/login" passHref>
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
  };
  
  const menuItems = isCoach ? coachTabs : playerTabs;
  
  const renderContent = () => {
    if (isCoach) {
      switch (activeTab) {
        case 'team':
          return (
            <div className="mt-4 space-y-8">
              <PlayerStats players={recruitedPlayers} isLoading={isLoadingCoachData} />
              <PendingInvites invites={pendingInvites} isLoading={isLoadingCoachData} />
            </div>
          );
        case 'analytics':
          return <CoachAnalytics players={recruitedPlayers} isLoading={isLoadingCoachData} />;
        case 'scouting':
          return <PlayerScouting players={players} isLoading={isLoadingCoachData} onInviteSent={fetchCoachData} />;
        case 'messages':
          return <Messages userId={userId} />;
        case 'community':
          return <CommunityHub userId={userId} userName={userName} />;
        default:
          return null;
      }
    } else {
       switch (activeTab) {
        case 'home':
          return <HomeDashboard 
                    userId={userId} 
                    workouts={workoutHistory} 
                    isLoadingHistory={isLoadingHistory}
                    physiqueHistory={physiqueHistory}
                    isLoadingPhysique={isLoadingPhysique}
                 />;
        case 'history':
          return <WorkoutHistory workouts={workoutHistory} isLoading={isLoadingHistory} user={currentUser}/>;
        case 'analysis':
          return <WorkoutAnalysis userId={userId} />;
        case 'ai-insights':
          return <AiInsights userId={userId} />;
        case 'recommendations':
          return <PersonalizedRecommendations userId={userId} workouts={workoutHistory} isLoading={isLoadingHistory} />;
        case 'physique':
            return (
                <div className="grid lg:grid-cols-2 gap-8">
                    <PhysiqueRater userId={userId}/>
                    <PhysiqueHistory userId={userId} />
                </div>
            );
        case 'find-sport':
            return <SportMatch userId={userId} workouts={workoutHistory} isLoading={isLoadingHistory} />;
        case 'invites':
            return <PlayerInvites userId={userId} />;
        case 'messages':
          return <Messages userId={userId} />;
        case 'community':
          return <CommunityHub userId={userId} userName={userName} />;
        default:
          return null;
       }
    }
  }


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
                    <Button variant="ghost" size="icon">
                        <MoreVertical />
                        <span className="sr-only">Features</span>
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
          
          <div className="mt-4">
            {renderContent()}
          </div>

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
