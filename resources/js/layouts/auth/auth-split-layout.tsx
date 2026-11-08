import { BrandWordmark } from '@/components/app-logo';
import { Link } from '@inertiajs/react';
import { Gift, ShieldCheck, Store } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

const points = [
    { icon: Gift, text: 'Wish lists and registries in one place' },
    { icon: Store, text: 'Guests shop at any store they like' },
    { icon: ShieldCheck, text: 'Surprise protection, item by item' },
];

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="bg-background grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
            <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, #2a1660 0%, #4c2fa0 45%, #e9877c 120%)' }} />
                <div className="bg-grain absolute inset-0 opacity-40" />
                <Link href={route('home')} className="relative z-10 text-white">
                    <BrandWordmark className="[&>span:first-child]:bg-white/15 [&>span:first-child]:text-white" />
                </Link>
                <div className="relative z-10 max-w-md text-white">
                    <h2 className="font-display text-4xl leading-tight font-medium text-balance">Gifting made easy, for everyone involved.</h2>
                    <ul className="mt-8 space-y-4">
                        {points.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-white/90">
                                <span className="flex size-9 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/20">
                                    <Icon className="size-4" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative z-10 text-sm text-white/60">Free for list makers. No account needed for gift givers.</p>
            </div>
            <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-10">
                <div className="w-full max-w-sm">
                    <Link href={route('home')} className="mb-10 flex justify-center lg:hidden">
                        <BrandWordmark />
                    </Link>
                    <div className="mb-8 space-y-2 text-center lg:text-left">
                        <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
