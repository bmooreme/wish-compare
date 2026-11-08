import { GuestItemCard } from '@/components/lists/guest-item-card';
import { ListCover } from '@/components/lists/list-cover';
import { PurchaseDialog } from '@/components/lists/purchase-dialog';
import { ShareButton } from '@/components/lists/copy-link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PublicLayout from '@/layouts/public-layout';
import { countdownLabel, formatDate, postJson } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type GuestItem, type ShippingAddress, type StoreChoice } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Eye, LoaderCircle, MapPin, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    list: {
        title: string;
        type: 'wishlist' | 'registry';
        theme: string;
        owner_name: string | null;
        token: string;
        description: string | null;
        event_date: string | null;
        share_url: string;
        has_shipping_address: boolean;
    };
    items: GuestItem[];
    isOwner: boolean;
    stores: StoreChoice[];
    turnstileSiteKey: string | null;
}

type Filter = 'all' | 'most_wanted' | 'available';

export default function SharedList({ list, items, isOwner, stores, turnstileSiteKey }: Props) {
    const [filter, setFilter] = useState<Filter>('all');
    const [buying, setBuying] = useState<GuestItem | null>(null);
    const [lastStore, setLastStore] = useState<string | null>(null);
    const isRegistry = list.type === 'registry';
    const countdown = countdownLabel(list.event_date);

    const counts = useMemo(
        () => ({
            all: items.length,
            most_wanted: items.filter((i) => i.most_wanted).length,
            available: items.filter((i) => !i.status.complete).length,
        }),
        [items],
    );

    const visible = useMemo(() => {
        const filtered = items.filter((i) => (filter === 'most_wanted' ? i.most_wanted : filter === 'available' ? !i.status.complete : true));
        // Keep the owner's order, but sink fully purchased gifts to the bottom.
        return [...filtered].sort((a, b) => Number(a.status.complete) - Number(b.status.complete));
    }, [items, filter]);

    const ownerFirst = list.owner_name?.split(' ')[0] ?? 'the owner';
    const storeForDialog = lastStore && stores.some((s) => s.key === lastStore) ? lastStore : null;

    return (
        <PublicLayout showDisclosure>
            <Head title={`${list.title}${list.owner_name ? ` · ${list.owner_name}` : ''}`}>
                <meta name="robots" content="noindex" />
            </Head>

            {isOwner && (
                <div className="bg-foreground text-background">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="flex items-center gap-2">
                            <Eye className="size-4 shrink-0" /> You’re previewing your list as guests see it. Items with hidden status always look available to you.
                        </p>
                        <Link href={route('dashboard')} className="font-semibold underline-offset-4 hover:underline">
                            Back to editing
                        </Link>
                    </div>
                </div>
            )}

            <ListCover themeKey={list.theme} className="border-b">
                <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 md:py-20">
                    <p className="text-sm font-semibold tracking-[0.18em] uppercase opacity-75">
                        {isRegistry ? 'Registry' : 'Wish list'}
                        {list.owner_name && <> · {list.owner_name}</>}
                    </p>
                    <h1 className="font-display mx-auto mt-3 max-w-3xl text-4xl leading-tight font-medium text-balance md:text-6xl">{list.title}</h1>
                    {list.event_date && (
                        <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-sm font-medium opacity-85">
                            <CalendarDays className="size-4" /> {formatDate(list.event_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            {countdown && <span className="rounded-full bg-black/10 px-2.5 py-0.5">{countdown}</span>}
                        </p>
                    )}
                    {list.description && <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed whitespace-pre-line opacity-90">{list.description}</p>}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <ShareButton url={list.share_url} title={list.title} className="bg-white/85 text-black shadow-sm hover:bg-white" />
                        {list.has_shipping_address && <ShippingAddressButton token={list.token} />}
                    </div>
                </div>
            </ListCover>

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <HowItWorks ownerFirst={ownerFirst} />

                <div className="mt-10 mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="bg-muted inline-flex flex-wrap rounded-full p-1 text-sm">
                        {(
                            [
                                ['all', 'All'],
                                ['available', 'Still needed'],
                                ['most_wanted', 'Most wanted'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={cn('rounded-full px-4 py-1.5 font-medium transition', filter === key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >
                                {label} <span className="text-muted-foreground ml-0.5">{counts[key]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-14 text-center">
                        <Sparkles className="text-muted-foreground/50 mx-auto size-10" strokeWidth={1.25} />
                        <p className="mt-3 font-medium">{items.length === 0 ? 'This list is still being put together.' : 'Nothing here right now.'}</p>
                        <p className="text-muted-foreground mt-1 text-sm">{items.length === 0 ? 'Check back soon!' : 'Try another filter.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visible.map((item) => (
                            <GuestItemCard
                                key={item.id}
                                item={item}
                                isRegistry={isRegistry}
                                isOwner={isOwner}
                                onShop={setLastStore}
                                onPurchased={() => setBuying(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <PurchaseDialog
                item={buying}
                onClose={() => setBuying(null)}
                token={list.token}
                ownerName={list.owner_name}
                isRegistry={isRegistry}
                stores={stores}
                defaultStore={storeForDialog}
                turnstileSiteKey={turnstileSiteKey}
            />
        </PublicLayout>
    );
}

function HowItWorks({ ownerFirst }: { ownerFirst: string }) {
    const steps = [
        { icon: Sparkles, title: 'Pick a gift', text: `Browse what ${ownerFirst} would love.` },
        { icon: ShoppingBag, title: 'Buy it anywhere', text: 'Use any store button. Prices and shipping are up to the store.' },
        { icon: PackageCheck, title: 'Mark it purchased', text: 'Come back and tap “I bought this” so nobody doubles up.' },
    ];

    return (
        <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="bg-card flex items-start gap-3 rounded-2xl border p-4">
                    <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                        <Icon className="size-4" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold">
                            <span className="text-muted-foreground mr-1">{i + 1}.</span>
                            {title}
                        </p>
                        <p className="text-muted-foreground text-sm">{text}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

function ShippingAddressButton({ token }: { token: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<ShippingAddress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reveal = async () => {
        setOpen(true);
        if (address) return;
        setLoading(true);
        setError(null);
        try {
            const res = await postJson<{ address: ShippingAddress }>(route('lists.address', token));
            setAddress(res.address);
        } catch {
            setError('We couldn’t load the address. Please try again in a moment.');
        }
        setLoading(false);
    };

    const lines = address ? [address.name, address.line1, address.line2, [address.city, [address.state, address.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean) : [];

    return (
        <>
            <Button variant="secondary" className="bg-white/85 text-black shadow-sm hover:bg-white" onClick={reveal}>
                <MapPin /> Show shipping address
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Shipping address</DialogTitle>
                        <DialogDescription>Use this when checking out so your gift arrives at the right place.</DialogDescription>
                    </DialogHeader>
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <LoaderCircle className="text-muted-foreground animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : (
                        <address className="bg-muted/60 rounded-xl p-4 leading-relaxed not-italic">
                            {lines.map((line) => (
                                <span key={line} className="block">
                                    {line}
                                </span>
                            ))}
                        </address>
                    )}
                    {address && (
                        <Button variant="outline" onClick={() => navigator.clipboard?.writeText(lines.join('\n'))}>
                            Copy address
                        </Button>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
