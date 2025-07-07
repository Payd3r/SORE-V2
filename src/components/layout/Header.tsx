'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, Upload, User, Map, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/stats', label: 'Stats', icon: BarChart },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/profile', label: 'Profile', icon: User },
];

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-glass-light backdrop-blur-xl dark:bg-glass-dark">
            <div className="container flex h-14 items-center">
                <nav className="flex items-center space-x-4 lg:space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary-light dark:hover:text-primary-dark",
                                pathname === item.href ? "text-primary-light dark:text-primary-dark" : "text-secondary-light dark:text-secondary-dark"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
} 