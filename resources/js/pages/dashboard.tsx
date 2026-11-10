import { PrivacyBadge, TypeBadge } from '@/components/lists/badges';
import { CopyLinkButton } from '@/components/lists/copy-link';
import { ListCover } from '@/components/lists/list-cover';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { countdownLabel, formatDate } from '@/lib/format';
import { type BreadcrumbItem, type ListSummary, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Download, Gift, Heart, ListChecks, Plus, Sparkles } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My lists', href: '/dashboard' }];

export default function Dashboard({ lists }: { lists: ListSummary[] }) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My lists" />
            <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm">Welcome back, {firstName}</p>
                        <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">My lists</h1>
                    </div>
                    {lists.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost" asChild>
                                <Link href={route('import.amazon')}>
                                    <Download /> Import from Amazon
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('lists.create', { type: 'registry' })}>
                                    <Gift /> New registry
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={route('lists.create', { type: 'wishlist' })}>
                                    <Plus /> New wish list
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {lists.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {lists.map((list) => (
                            <ListCard key={list.id} list={list} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function ListCard({ list }: { list: ListSummary }) {
    const countdown = list.type === 'registry' ? countdownLabel(list.event_date) : null;

    return (
        <article className="group bg-card relative flex flex-col overflow-hidden rounded-2xl border shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg">
            <Link href={route('lists.show', list.id)} className="absolute inset-0 z-10" aria-label={`Manage ${list.title}`} />
            <ListCover themeKey={list.theme} className="h-32 p-4">
                <div className="flex items-start justify-between">
                    <TypeBadge type={list.type} />
                    {countdown && (
                        <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">{countdown}</span>
                    )}
                </div>
            </ListCover>
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                    <h2 className="font-display line-clamp-2 text-xl leading-snug font-medium">{list.title}</h2>
                    {list.event_date && (
                        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                            <CalendarDays className="size-3.5" /> {formatDate(list.event_date)}
                        </p>
                    )}
                </div>
                <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5">
                        <ListChecks className="size-4" /> {list.items_count} {list.items_count === 1 ? 'item' : 'items'}
                    </span>
                    {!!list.most_wanted_count && (
                        <span className="text-brand flex items-center gap-1.5">
                            <Heart className="size-4 fill-current" /> {list.most_wanted_count} most wanted
                        </span>
                    )}
                    <PrivacyBadge privacy={list.privacy} />
                </div>
                <div className="relative z-20 flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" asChild>
                        <Link href={route('lists.show', list.id)}>Manage</Link>
                    </Button>
                    <CopyLinkButton size="sm" url={list.share_url} label="Share link" />
                </div>
            </div>
        </article>
    );
}

function EmptyState() {
    const options = [
        {
            type: 'wishlist',
            title: 'Wish list',
            description: 'Birthdays, holidays, or just because. Collect things you love from any store.',
            icon: Sparkles,
            theme: 'dusk',
        },
        {
            type: 'registry',
            title: 'Registry',
            description: 'Weddings, babies and housewarmings, with quantities, an event date and an optional shipping address.',
            icon: Gift,
            theme: 'blush',
        },
    ];

    return (
        <div className="rounded-3xl border border-dashed p-6 md:p-10">
            <div className="mx-auto max-w-xl text-center">
                <h2 className="font-display text-2xl font-medium">Create your first list</h2>
                <p className="text-muted-foreground mt-2">
                    Add items from any online store, share one link, and let friends and family take it from there.
                </p>
            </div>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
                {options.map(({ type, title, description, icon: Icon, theme }) => (
                    <Link
                        key={type}
                        href={route('lists.create', { type })}
                        className="group bg-card overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <ListCover themeKey={theme} className="flex h-28 items-center justify-center">
                            <Icon className="size-10" strokeWidth={1.5} />
                        </ListCover>
                        <div className="p-5">
                            <h3 className="font-display text-lg font-medium">{title}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                            <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
                                Start a {title.toLowerCase()} →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <p className="text-muted-foreground mt-6 text-center text-sm">
                Already have a list on Amazon?{' '}
                <Link href={route('import.amazon')} className="text-primary font-medium hover:underline">
                    Import it in a minute
                </Link>
            </p>
        </div>
    );
}
