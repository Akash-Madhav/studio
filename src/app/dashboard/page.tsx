
'use client';

import React, { Suspense, useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  BrainCircuit,
  Dumbbell,
  LogIn,
  Mail,
  MessageSquare,
  Search,
  Target,
  Users,
  ArrowLeft,
  RefreshCw,
  User as UserIcon,
  History,
  Rss,
} from "lucide-react";
import Image from "next/image";

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
import PlayerInvites from "@/components/features/player-invites";
import PlayerScouting from "@/components/features/player-scouting";
import PlayerStats from '@/components/features/player-stats';
import Messages from '@/components/features/messages';
import CommunityHub from '@/components/features/community-hub';
import PendingInvites from '@/components/features/pending-invites';
import ProfileSettings from '@/components/features/profile-settings';
import WorkoutHistory from '@/components/features/workout-history';
import { getPlayersForScouting, getPendingInvites, getUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import SportMatch from '@/components/features/sport-match';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

interface PlayerData {
  id: string;
  name: string;
  performanceData: string;
  userProfile: string;
  status: string;
}

interface Invite {
  inviteId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  sentAt: Date;
}

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

async function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get('role') || 'player';
  const initialUserId = searchParams.get('userId') || (role === 'coach' ? 'coach1' : 'player1');
  const isCoach = role === 'coach';
  const initialTab = searchParams.get('tab') || (isCoach ? 'player-stats' : 'dashboard');
  
  const [activeTab, setActiveTab] = useState(initialTab);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [recruitedPlayerIds, setRecruitedPlayerIds] = useState<string[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isPending, startTransition] = useTransition();

  const userResult = await getUser(initialUserId);
  const currentUser = userResult.user as User | null;

  const fetchCoachData = React.useCallback(async () => {
    if (!isCoach) return;

    setIsLoadingData(true);
    startTransition(async () => {
        const playersResult = await getPlayersForScouting(initialUserId);
        if (playersResult.success && playersResult.players) {
            setPlayers(playersResult.players.map(p => ({...p, name: p.name || `Player ${p.id.substring(0,4)}`})));
            setRecruitedPlayerIds(playersResult.recruitedPlayerIds || []);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error fetching players',
                description: 'Could not load player data. Please try refreshing.',
            });
        }
    
        const invitesResult = await getPendingInvites(initialUserId);
        if (invitesResult.success && invitesResult.invites) {
            setInvites(invitesResult.invites);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error fetching invites',
                description: 'Could not load invites. Please try refreshing.',
            });
        }
        setIsLoadingData(false);
    });
  }, [isCoach, initialUserId, toast]);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);


  useEffect(() => {
    const tab = searchParams.get('tab') || (isCoach ? 'player-stats' : 'dashboard');
    setActiveTab(tab);
  }, [searchParams, isCoach]);


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

  const userId = initialUserId;
  const dashboardIsCoachView = isCoach;
  const dashboardIsPlayerView = !isCoach;
  
  const userName = currentUser?.name || '';
  const displayName = isCoach ? `Coach ${userName}` : userName;
  
  const recruitedPlayers = players.filter(p => recruitedPlayerIds.includes(p.id));

  const updateUrl = (tab: string) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    newUrl.searchParams.set('userId', initialUserId);
    newUrl.searchParams.set('role', role);
    window.history.pushState({ ...window.history.state, as: newUrl.href, url: newUrl.href }, '', newUrl.href);
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
          {isCoach && (
            <Button variant="ghost" size="sm" onClick={fetchCoachData} disabled={isPending || isLoadingData}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending || isLoadingData ? 'animate-spin' : ''}`} />
                Refresh Data
            </Button>
          )}
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
                    <AvatarFallback>{initialUserId.charAt(0).toUpperCase()}</AvatarFallback>
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
                <DropdownMenuItem>Support</DropdownMenuItem>
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
              ? 'Your central hub for scouting and analyzing player performance.'
              : 'Your central hub for tracking, analyzing, and optimizing your fitness journey.'}
          </p>
        </div>
        
        {dashboardIsCoachView && (
           <Tabs value={activeTab} onValueChange={updateUrl} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="player-stats">
                    <BrainCircuit className="mr-2" />
                    Player Stats
                  </TabsTrigger>
                  <TabsTrigger value="player-scouting">
                    <Users className="mr-2" />
                    Scouting
                  </TabsTrigger>
                  <TabsTrigger value="pending-invites">
                    <Mail className="mr-2" />
                    Invites
                  </TabsTrigger>
                  <TabsTrigger value="messages">
                    <MessageSquare className="mr-2" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="community">
                    <Rss className="mr-2" />
                    Community
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="player-stats" className="mt-4">
                  <PlayerStats players={recruitedPlayers} isLoading={isPending || isLoadingData} />
              </TabsContent>
               <TabsContent value="player-scouting" className="mt-4">
                  <PlayerScouting players={players} isLoading={isPending || isLoadingData} onInviteSent={fetchCoachData} />
              </TabsContent>
              <TabsContent value="pending-invites" className="mt-4">
                  <PendingInvites invites={invites} isLoading={isPending || isLoadingData}/>
              </TabsContent>
              <TabsContent value="messages" className="mt-4">
                  <Messages userId={userId} />
              </TabsContent>
               <TabsContent value="community" className="mt-4">
                  <CommunityHub userId={userId} role="coach" />
              </TabsContent>
           </Tabs>
        )}

        {dashboardIsPlayerView && (
           <Tabs value={activeTab} onValueChange={updateUrl} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-9 h-auto">
                <TabsTrigger value="dashboard">
                  <BarChart3 className="mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="ai-insights">
                  <BrainCircuit className="mr-2" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="log-performance">
                  <LogIn className="mr-2" />
                  Log
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                  <Target className="mr-2" />
                  Recs
                </TabsTrigger>
                <TabsTrigger value="find-sport">
                  <Search className="mr-2" />
                  Find Sport
                </TabsTrigger>
                 <TabsTrigger value="history">
                    <History className="mr-2" />
                    History
                </TabsTrigger>
                <TabsTrigger value="invites">
                  <Mail className="mr-2" />
                  Invites
                </TabsTrigger>
                 <TabsTrigger value="messages">
                    <MessageSquare className="mr-2" />
                    Messages
                </TabsTrigger>
                <TabsTrigger value="community">
                    <Rss className="mr-2" />
                    Community
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="mt-4">
                <ProgressVisualization userId={userId} />
              </TabsContent>
              <TabsContent value="ai-insights" className="mt-4">
                  <AiInsights userId={userId} />
              </TabsContent>
              <TabsContent value="log-performance" className="mt-4">
                  <PerformanceLogging userId={userId}/>
              </TabsContent>
              <TabsContent value="recommendations" className="mt-4">
                  <PersonalizedRecommendations userId={userId} />
              </TabsContent>
              <TabsContent value="find-sport" className="mt-4">
                  <SportMatch userId={userId} />
              </TabsContent>
               <TabsContent value="history" className="mt-4">
                  <WorkoutHistory userId={userId} />
              </TabsContent>
              <TabsContent value="invites" className="mt-4">
                  <PlayerInvites userId={userId} />
              </TabsContent>
              <TabsContent value="messages" className="mt-4">
                  <Messages userId={userId} />
              </TabsContent>
              <TabsContent value="community" className="mt-4">
                  <CommunityHub userId={userId} role="player" />
              </TabsContent>
           </Tabs>
        )}
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
