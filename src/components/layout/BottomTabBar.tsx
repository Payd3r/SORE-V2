'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, Upload, User, Map, CalendarClock, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/countdowns', label: 'Countdowns', icon: CalendarClock },
    { href: '/journeys', label: 'Journeys', icon: Plane },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomTabBar() {
    const pathname = usePathname();

    return (
        <footer className="fixed bottom-0 z-50 w-full border-t border-white/20 bg-glass-light backdrop-blur-xl dark:bg-glass-dark md:hidden">
            <nav className="flex h-16 items-center justify-around">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors",
                            pathname === item.href 
                                ? "text-primary-light dark:text-primary-dark" 
                                : "text-secondary-light hover:text-primary-light dark:text-secondary-dark dark:hover:text-primary-dark"
                        )}
                    >
                        <item.icon className="h-6 w-6" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </footer>
    );
} 