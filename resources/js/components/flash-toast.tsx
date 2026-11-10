import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Shows the server's flash "success" message as a toast. */
export function FlashToast() {
    const { flash } = usePage<SharedData>().props;
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!flash?.success) return;
        setMessage(flash.success);
        const timer = window.setTimeout(() => setMessage(null), 5000);
        return () => window.clearTimeout(timer);
    }, [flash?.success]);

    if (!message) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6">
            <div
                role="status"
                className="animate-in fade-in slide-in-from-bottom-4 bg-foreground text-background pointer-events-auto flex max-w-md items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-xl"
            >
                <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0 dark:text-emerald-600" />
                <p className="flex-1">{message}</p>
                <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
