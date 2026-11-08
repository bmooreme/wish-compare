import { PrivacyBadge, TypeBadge } from '@/components/lists/badges';
import { AddItem } from '@/components/lists/add-item';
import { CopyLinkButton } from '@/components/lists/copy-link';
import { ListCover } from '@/components/lists/list-cover';
import { OwnerItemRow } from '@/components/lists/owner-item-row';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { countdownLabel, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type ListSummary, type OwnerItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ExternalLink, Gift, Settings, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState, type DragEvent } from 'react';

interface Props {
    list: ListSummary & { notify_on_purchase: boolean; shipping_enabled: boolean };
    items: OwnerItem[];
}

type Filter = 'all' | 'most_wanted';

export default function ShowList({ list, items: serverItems }: Props) {
    const [items, setItems] = useState(serverItems);
    const [filter, setFilter] = useState<Filter>('all');
    const [dragId, setDragId] = useState<number | null>(null);
    const [overId, setOverId] = useState<number | null>(null);
    const isRegistry = list.type === 'registry';

    useEffect(() => setItems(serverItems), [serverItems]);

    const visible = useMemo(() => (filter === 'most_wanted' ? items.filter((i) => i.most_wanted) : items), [items, filter]);
    const mostWanted = items.filter((i) => i.most_wanted).length;
    const countdown = countdownLabel(list.event_date);

    const drop = (targetId: number) => {
        if (dragId === null || dragId === targetId) return;
        const next = [...items];
        const from = next.findIndex((i) => i.id === dragId);
        const to = next.findIndex((i) => i.id === targetId);
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setItems(next);
        router.post(route('items.reorder', list.id), { order: next.map((i) => i.id) }, { preserveScroll: true, preserveState: true });
    };

    const dragPropsFor = (id: number) => ({
        draggable: filter === 'all',
        onDragStart: (e: DragEvent) => {
            e.dataTransfer.effectAllowed = 'move';
            setDragId(id);
        },
        onDragOver: (e: DragEvent) => {
            e.preventDefault();
            if (overId !== id) setOverId(id);
        },
        onDrop: (e: DragEvent) => {
            e.preventDefault();
            drop(id);
            setOverId(null);
        },
        onDragEnd: () => {
            setDragId(null);
            setOverId(null);
        },
        isDragging: dragId === id,
        isOver: overId === id && dragId !== id,
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My lists', href: '/dashboard' },
                { title: list.title, href: route('lists.show', list.id) },
            ]}
        >
            <Head title={list.title} />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
                <ListCover themeKey={list.theme} className="rounded-3xl p-6 md:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <TypeBadge type={list.type} />
                                <PrivacyBadge privacy={list.privacy} className="bg-white/60 text-black/70" />
                            </div>
                            <h1 className="font-display text-3xl leading-tight font-medium text-balance md:text-4xl">{list.title}</h1>
                            {list.event_date && (
                                <p className="flex items-center gap-2 text-sm font-medium opacity-80">
                                    <CalendarDays className="size-4" /> {formatDate(list.event_date)}
                                    {countdown && <span className="rounded-full bg-black/10 px-2 py-0.5">{countdown}</span>}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" className="bg-white/80 text-black hover:bg-white" asChild>
                                <a href={list.share_url} target="_blank" rel="noopener">
                                    <ExternalLink /> Preview
                                </a>
                            </Button>
                            <Button variant="secondary" className="bg-white/80 text-black hover:bg-white" asChild>
                                <Link href={route('lists.edit', list.id)}>
                                    <Settings /> Settings
                                </Link>
                            </Button>
                        </div>
                    </div>
                </ListCover>

                <section className="bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-xs sm:flex-row sm:items-center md:p-5">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Share your list</p>
                        <p className="text-muted-foreground truncate font-mono text-sm">{list.share_url}</p>
                    </div>
                    <CopyLinkButton url={list.share_url} />
                </section>

                <AddItem listId={list.id} isRegistry={isRegistry} />

                <div className="bg-accent/60 text-accent-foreground flex items-start gap-3 rounded-2xl p-4 text-sm">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                    <p>
                        <span className="font-semibold">Surprise protection is on.</span> Purchase status is hidden from you unless you switch it on for an item. Guests always see
                        what’s been bought, so nobody doubles up.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="bg-muted inline-flex rounded-full p-1 text-sm">
                        {(
                            [
                                ['all', `All items (${items.length})`],
                                ['most_wanted', `Most wanted (${mostWanted})`],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={cn('rounded-full px-4 py-1.5 font-medium transition', filter === key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {filter === 'all' && items.length > 1 && <p className="text-muted-foreground hidden text-sm sm:block">Drag items to reorder</p>}
                </div>

                {visible.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-12 text-center">
                        <Gift className="text-muted-foreground/50 mx-auto size-10" strokeWidth={1.25} />
                        <p className="mt-3 font-medium">{filter === 'all' ? 'No items yet' : 'Nothing marked as most wanted'}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {filter === 'all' ? 'Paste a product link above to add your first item.' : 'Tap the heart on any item to flag it.'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {visible.map((item) => (
                            <OwnerItemRow key={item.id} item={item} listId={list.id} isRegistry={isRegistry} dragProps={dragPropsFor(item.id)} />
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
