import { cn } from '@/lib/utils';
import { type ListType, type Privacy } from '@/types';
import { Globe, Heart, Link2, Lock } from 'lucide-react';

const privacyMeta: Record<Privacy, { label: string; icon: typeof Globe; hint: string }> = {
    public: { label: 'Public', icon: Globe, hint: 'Anyone can find it by searching' },
    unlisted: { label: 'Link only', icon: Link2, hint: 'Only people with the link' },
    password: { label: 'Password', icon: Lock, hint: 'Link plus a password' },
};

export function PrivacyBadge({ privacy, className }: { privacy: Privacy; className?: string }) {
    const meta = privacyMeta[privacy];
    const Icon = meta.icon;

    return (
        <span
            title={meta.hint}
            className={cn('inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium dark:bg-white/10', className)}
        >
            <Icon className="size-3" /> {meta.label}
        </span>
    );
}

export function TypeBadge({ type, className }: { type: ListType; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-black/70 uppercase backdrop-blur',
                className,
            )}
        >
            {type === 'registry' ? 'Registry' : 'Wish list'}
        </span>
    );
}

export function MostWantedBadge({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'bg-brand text-brand-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm',
                className,
            )}
        >
            <Heart className="size-3 fill-current" /> Most wanted
        </span>
    );
}

export { privacyMeta };
