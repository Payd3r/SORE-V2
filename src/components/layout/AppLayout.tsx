'use client';

import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith('/auth');

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="relative flex min-h-screen flex-col">
            <TopBar />
            <main className="flex-1 pb-16">{children}</main>
            <BottomTabBar />
        </div>
    );
} 