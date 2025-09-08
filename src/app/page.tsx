
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Shield, Users, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Dumbbell className="w-6 h-6" />
          <span className="font-bold">OptiFit AI</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" passHref>
            <Button>Go to App</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter text-primary sm:text-5xl xl:text-6xl/none">
                    Unlock Your Full Athletic Potential with OptiFit AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Our platform offers personalized, AI-driven fitness assessments to help you evaluate, track, and enhance your physical capabilities.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard" passHref>
                    <Button size="lg">Get Started</Button>
                  </Link>
                </div>
              </div>
              <Image
                src="https://picsum.photos/1200/800"
                width="1200"
                height="800"
                alt="Hero"
                data-ai-hint="fitness workout"
                className="mx-auto overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section id="user-types" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Who is OptiFit AI for?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Whether you're a competitive athlete under professional guidance or a passionate individual driving your own progress, our platform adapts to your journey.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-2 mt-12">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">For the Coached Athlete</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-muted-foreground">
                    Seamlessly integrate OptiFit AI into your training regimen. Share detailed performance analytics with your coach for data-driven feedback and program adjustments.
                  </p>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Share progress with your coach.</li>
                    <li>Get data-backed insights to supplement coaching.</li>
                    <li>Track long-term development with precision.</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard" passHref className="w-full">
                    <Button variant="secondary" className="w-full">Enhance Your Coaching</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-accent/10 p-3 rounded-full">
                      <Zap className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl">For the Enthusiastic Player</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-muted-foreground">
                    Take control of your fitness journey. Use our powerful AI to analyze your performance, identify areas for improvement, and receive personalized recommendations to reach your goals faster.
                  </p>
                   <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>AI-driven personalized workout plans.</li>
                    <li>Discover your strengths and weaknesses.</li>
                    <li>Find new sports you're genetically suited for.</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard" passHref className="w-full">
                    <Button className="w-full">Start Your Journey</Button>
                  </Link>
                </CardFooter>
              </Card>
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
