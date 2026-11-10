import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';
import { useState } from 'react';

export function ItemImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
    const [failed, setFailed] = useState(false);

    return (
        <div className={cn('bg-muted relative flex items-center justify-center overflow-hidden', className)}>
            {src && !failed ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setFailed(true)}
                    className="size-full object-contain p-3 mix-blend-multiply dark:mix-blend-normal"
                />
            ) : (
                <Gift className="text-muted-foreground/40 size-1/3" strokeWidth={1.25} />
            )}
        </div>
    );
}
