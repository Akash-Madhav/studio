
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import ProfileSettings from '@/components/features/profile-settings';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

function SettingsContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const backUrl = `/dashboard?role=${role}&userId=${userId}`;

    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-destructive">User ID is missing.</p>
                <Link href="/" passHref>
                    <Button variant="link">Return to Login</Button>
                </Link>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50 justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Dumbbell className="h-6 w-6" />
                    <span className="font-bold">OptiFit AI</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href={backUrl} passHref>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2"/>
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <ProfileSettings userId={userId} role={role ?? 'player'} />
            </main>
        </div>
    )
}


export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading Settings...</div>}>
            <SettingsContent />
        </Suspense>
    )
}

    
