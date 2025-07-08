'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import SearchBar from '../Search/SearchBar';

export default function TopBar() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="inline-block font-bold">SORE-V2</span>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <SearchBar />
                </div>

                <div className="flex items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-1">
                        {session ? (
                             <Button asChild variant="ghost">
                                <Link href="/profile">Profilo</Link>
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href="/auth/signin">Accedi</Link>
                            </Button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
} 