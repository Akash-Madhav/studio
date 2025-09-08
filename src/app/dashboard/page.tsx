
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  BrainCircuit,
  Dumbbell,
  LogIn,
  Medal,
  MessageSquare,
  Target,
  Users,
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
import SportMatch from "@/components/features/sport-match";
import PlayerScouting from "@/components/features/player-scouting";
import PlayerStats from '@/components/features/player-stats';
import Messages from '@/components/features/messages';

function DashboardContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'player';
  const isCoach = role === 'coach';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Dumbbell className="h-6 w-6" />
          <span className="font-bold">OptiFit AI</span>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial"></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src="https://picsum.photos/50/50"
                    alt="@user"
                    width={50}
                    height={50}
                    data-ai-hint="person face"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {isCoach ? 'Coach' : 'Fitness'} Dashboard
          </h1>
          <p className="text-muted-foreground">
            {isCoach
              ? 'Your central hub for scouting and analyzing player performance.'
              : 'Your central hub for tracking, analyzing, and optimizing your fitness journey.'}
          </p>
        </div>
        <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className={`grid w-full h-auto ${isCoach ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'}`}>
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2" />
              Dashboard
            </TabsTrigger>
            {isCoach ? (
              <TabsTrigger value="player-stats">
                <BrainCircuit className="mr-2" />
                Player Stats
              </TabsTrigger>
            ) : (
                <TabsTrigger value="ai-insights">
                  <BrainCircuit className="mr-2" />
                  Insights
                </TabsTrigger>
            )}
            {!isCoach && (
              <>
                <TabsTrigger value="log-performance">
                  <LogIn className="mr-2" />
                  Log
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                  <Target className="mr-2" />
                  Recs
                </TabsTrigger>
                <TabsTrigger value="sport-match">
                  <Medal className="mr-2" />
                  Match
                </TabsTrigger>
              </>
            )}
            {isCoach && (
              <TabsTrigger value="player-scouting">
                <Users className="mr-2" />
                Scouting
              </TabsTrigger>
            )}
            <TabsTrigger value="messages">
                <MessageSquare className="mr-2" />
                Messages
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-4">
            <ProgressVisualization />
          </TabsContent>
          {isCoach ? (
            <TabsContent value="player-stats" className="mt-4">
              <PlayerStats />
            </TabsContent>
          ) : (
            <TabsContent value="ai-insights" className="mt-4">
              <AiInsights />
            </TabsContent>
          )}
          {!isCoach && (
            <>
              <TabsContent value="log-performance" className="mt-4">
                <PerformanceLogging />
              </TabsContent>
              <TabsContent value="recommendations" className="mt-4">
                <PersonalizedRecommendations />
              </TabsContent>
              <TabsContent value="sport-match" className="mt-4">
                <SportMatch />
              </TabsContent>
            </>
          )}
          {isCoach && (
              <TabsContent value="player-scouting" className="mt-4">
                <PlayerScouting />
              </TabsContent>
          )}
           <TabsContent value="messages" className="mt-4">
              <Messages />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
