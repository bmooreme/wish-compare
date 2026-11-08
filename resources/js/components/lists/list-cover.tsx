import { theme } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { type PropsWithChildren } from 'react';

export function ListCover({ themeKey, className, children }: PropsWithChildren<{ themeKey: string; className?: string }>) {
    const t = theme(themeKey);

    return (
        <div className={cn('relative overflow-hidden', className)} style={{ background: t.gradient, color: t.ink }}>
            <svg className="pointer-events-none absolute -top-6 -right-6 size-40 opacity-25" viewBox="0 0 32 32" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M14 3.5c.6 4.9 2.1 7.9 4.6 9.4 1.6 1 3.6 1.5 6.4 1.8-2.8.3-4.8.8-6.4 1.8-2.5 1.5-4 4.5-4.6 9.4-.6-4.9-2.1-7.9-4.6-9.4-1.6-1-3.6-1.5-6.4-1.8 2.8-.3 4.8-.8 6.4-1.8 2.5-1.5 4-4.5 4.6-9.4Z"
                />
            </svg>
            <div className="bg-grain absolute inset-0 opacity-50" />
            <div className="relative">{children}</div>
        </div>
    );
}
