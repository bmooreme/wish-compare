import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { postJson } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Check, ImageOff, LoaderCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Candidate {
    url: string;
    title: string;
    source: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    identifier?: string | null;
    current?: string | null;
    onSelect: (url: string | null) => void;
}

/** True when a retailer photo API is configured on the server. */
export function usePhotoSearch() {
    return usePage<SharedData>().props.features?.imageSearch ?? false;
}

export function PhotoPicker({ open, onOpenChange, title, identifier, current, onSelect }: Props) {
    const [query, setQuery] = useState(title);
    const [candidates, setCandidates] = useState<Candidate[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [chosen, setChosen] = useState<string | null>(current ?? null);

    const run = async (q: string, withIdentifier: boolean) => {
        if (!q.trim()) return;
        setLoading(true);
        setFailed(false);
        try {
            const res = await postJson<{ query: string; candidates: Candidate[] }>(route('images.search'), {
                title: q,
                identifier: withIdentifier ? identifier : null,
            });
            setCandidates(res.candidates);
            if (withIdentifier) setQuery(res.query || q);
        } catch {
            setFailed(true);
            setCandidates([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!open) return;
        setChosen(current ?? null);
        setCandidates(null);
        setQuery(title);
        run(title, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const confirm = () => {
        onSelect(chosen);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Choose a photo</DialogTitle>
                    <DialogDescription>Product photos from our retail partners. Pick the one that matches your item exactly.</DialogDescription>
                </DialogHeader>

                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        run(query, false);
                    }}
                >
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" aria-label="Search for a photo" />
                    </div>
                    <Button type="submit" variant="outline" disabled={loading}>
                        Search
                    </Button>
                </form>

                <div className="min-h-48">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <LoaderCircle className="text-muted-foreground animate-spin" />
                        </div>
                    ) : candidates && candidates.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {candidates.map((c) => (
                                <button
                                    key={c.url}
                                    type="button"
                                    onClick={() => setChosen(c.url)}
                                    aria-pressed={chosen === c.url}
                                    className={cn(
                                        'group relative overflow-hidden rounded-xl border bg-white text-left transition',
                                        chosen === c.url ? 'ring-primary border-primary ring-2' : 'hover:border-foreground/30',
                                    )}
                                >
                                    <img
                                        src={c.url}
                                        alt={c.title}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        className="aspect-square w-full object-contain p-3"
                                    />
                                    <div className="border-t bg-white px-2.5 py-2">
                                        <p className="line-clamp-2 text-xs text-neutral-800">{c.title}</p>
                                        <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">{c.source}</p>
                                    </div>
                                    {chosen === c.url && (
                                        <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex size-6 items-center justify-center rounded-full shadow">
                                            <Check className="size-4" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : candidates ? (
                        <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 text-center text-sm">
                            <ImageOff className="size-8" strokeWidth={1.5} />
                            {failed
                                ? 'Photo search isn’t responding right now. Please try again shortly.'
                                : 'No photos found. Try fewer words, like the brand and model.'}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="ghost" onClick={() => setChosen(null)} disabled={!chosen}>
                        Use placeholder instead
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirm} disabled={chosen === (current ?? null)}>
                            Save photo
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
