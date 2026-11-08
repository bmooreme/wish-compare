import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { name } = usePage<SharedData>().props;

    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="font-display truncate text-lg leading-none font-semibold">{name}</span>
            </div>
        </>
    );
}

export function BrandWordmark({ className = '' }: { className?: string }) {
    const { name } = usePage<SharedData>().props;

    return (
        <span className={`flex items-center gap-2 ${className}`}>
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
                <AppLogoIcon className="size-5 fill-current" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">{name}</span>
        </span>
    );
}
