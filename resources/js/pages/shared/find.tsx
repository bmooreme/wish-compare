import { TypeBadge } from '@/components/lists/badges';
import { ListCover } from '@/components/lists/list-cover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicLayout from '@/layouts/public-layout';
import { formatDate } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Search } from 'lucide-react';
import { useState } from 'react';

interface Result {
    title: string;
    type: 'wishlist' | 'registry';
    theme: string;
    owner_name: string | null;
    event_date: string | null;
    items_count: number;
    share_url: string;
}

export default function FindList({ q, results }: { q: string; results: Result[] }) {
    const [term, setTerm] = useState(q);

    return (
        <PublicLayout>
            <Head title="Find a list" />
            <section className="border-b">
                <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 md:py-20">
                    <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">Find a registry or wish list</h1>
                    <p className="text-muted-foreground mt-3">Search by the list owner’s name or the list title. Only public lists appear here.</p>
                    <form
                        className="mx-auto mt-8 flex max-w-xl gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(route('lists.find'), { q: term }, { preserveState: true });
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. Jordan Rivera" className="h-12 rounded-full pl-10" aria-label="Search lists" />
                        </div>
                        <Button type="submit" size="lg" className="h-12 rounded-full px-6">
                            Search
                        </Button>
                    </form>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                {q.length >= 2 && (
                    <p className="text-muted-foreground mb-5 text-sm">
                        {results.length === 0 ? `No public lists match “${q}”. If you have a link, you can open it directly.` : `${results.length} ${results.length === 1 ? 'list' : 'lists'} found`}
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((r) => (
                        <a key={r.share_url} href={r.share_url} className="bg-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg">
                            <ListCover themeKey={r.theme} className="h-24 p-4">
                                <TypeBadge type={r.type} />
                            </ListCover>
                            <div className="p-4">
                                <h2 className="font-display text-lg leading-snug font-medium group-hover:underline">{r.title}</h2>
                                <p className="text-muted-foreground mt-1 text-sm">{r.owner_name}</p>
                                <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                                    {r.event_date && (
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="size-3.5" /> {formatDate(r.event_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                    <span>{r.items_count} items</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
