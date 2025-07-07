'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, Upload, User, Map, Settings, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/gallery', label: 'Gallery', icon: Map },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/upload', label: 'Upload', icon: Upload },
];

const userNavItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    const NavLink = ({ item }: { item: { href: string; label: string; icon: React.ElementType } }) => (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary"
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </Link>
    );

    return (
        <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 md:flex">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Map className="h-6 w-6" />
                    <span>SORE V2</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-2 py-4">
                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground">Main</h3>
                    {mainNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground">User</h3>
                    {userNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </div>
            </nav>
        </aside>
    );
} 