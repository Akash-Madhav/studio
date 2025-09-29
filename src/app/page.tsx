
"use client";

import Link from "next/link";
import { Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Dumbbell className="w-6 h-6" />
          <span className="font-bold">OptiFit AI</span>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/login" passHref>
                <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup" passHref>
                <Button>Sign Up</Button>
            </Link>
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Unlock Your Peak Performance with OptiFit AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Our AI-powered platform analyzes your workouts, provides personalized insights, and connects you with elite coaches to help you achieve your fitness goals faster.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup" passHref>
                    <Button size="lg" className="inline-flex h-12 items-center justify-center rounded-md px-8 text-sm font-medium">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
               <img
                src="https://picsum.photos/seed/fitness/1200/800"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                data-ai-hint="fitness workout"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Elevate Your Training</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Leverage cutting-edge AI to understand your performance like never before. From video analysis to personalized recommendations, we've got you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">AI Video Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your workout videos and get instant feedback on your form, rep counts, and more.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Personalized Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your workout data to provide actionable recommendations tailored to your goals.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Player & Coach Scouting</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with the right people. Coaches can find talent, and players can get discovered.
                </p>
              </div>
            </div>
          </div>
        </section>
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
