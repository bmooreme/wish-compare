import { ListCover } from '@/components/lists/list-cover';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    EyeOff,
    Gift,
    Heart,
    Link2,
    Lock,
    MapPin,
    PackageCheck,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Store,
    UserRoundX,
} from 'lucide-react';

const stores = ['Amazon', 'Walmart', 'Target', 'Best Buy', 'Barnes & Noble', 'Etsy', 'Wayfair', 'Crate & Barrel'];

const features = [
    {
        icon: EyeOff,
        title: 'Surprise protection',
        text: 'Purchases stay hidden from you by default. Reveal status item by item, only when you want to.',
    },
    {
        icon: Store,
        title: 'Every store, one list',
        text: 'Paste a link from any shop. Guests can buy from the original store or compare at other big retailers.',
    },
    { icon: UserRoundX, title: 'No account for guests', text: 'Friends and family open your link and shop. No sign-ups, no passwords, no friction.' },
    {
        icon: PackageCheck,
        title: 'No duplicate gifts',
        text: 'Buyers mark gifts purchased with their order number, and get a private link to change it later.',
    },
    { icon: Heart, title: 'Most wanted', text: 'Flag the things you’d love most so they stand out to everyone shopping your list.' },
    { icon: Lock, title: 'Your privacy, your call', text: 'Make a list public, link-only, or password protected. Change it any time.' },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const ctaHref = auth.user ? route('dashboard') : route('register');

    return (
        <PublicLayout showDisclosure>
            <Head title="Wish lists & gift registries for every store" />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div
                        className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
                        style={{ background: 'radial-gradient(closest-side, #b9a6f2, transparent)' }}
                    />
                    <div
                        className="absolute top-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
                        style={{ background: 'radial-gradient(closest-side, #f6a99b, transparent)' }}
                    />
                </div>
                <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
                    <div>
                        <p className="bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-xs">
                            <Sparkles className="text-brand size-4" /> Free wish lists & registries
                        </p>
                        <h1 className="font-display mt-6 text-5xl leading-[1.05] font-medium tracking-tight text-balance md:text-6xl lg:text-7xl">
                            The gift list that works with <em className="text-primary not-italic">every store</em>.
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
                            Collect gifts from anywhere online, share one link, and let friends and family shop wherever they like, while keeping
                            every surprise a surprise.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button size="lg" className="h-12 px-6 text-base" asChild>
                                <Link href={ctaHref}>
                                    {auth.user ? 'Go to my lists' : 'Start your list, free'} <ArrowRight />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-6 text-base" asChild>
                                <Link href={route('lists.find')}>Find someone’s list</Link>
                            </Button>
                        </div>
                        <p className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                            {['No app to install', 'Guests don’t need an account', 'Works on any phone'].map((t) => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <Check className="text-success size-4" /> {t}
                                </span>
                            ))}
                        </p>
                    </div>
                    <HeroVisual />
                </div>
            </section>

            {/* Stores strip */}
            <section className="bg-card/60 border-y">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                    <p className="text-muted-foreground text-center text-xs font-semibold tracking-[0.18em] uppercase">
                        Add gifts from your favorite stores
                    </p>
                    <div className="text-muted-foreground/80 mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
                        {stores.map((s) => (
                            <span key={s} className="font-display text-lg font-medium md:text-xl">
                                {s}
                            </span>
                        ))}
                        <span className="text-sm">and thousands more</span>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="font-display text-4xl font-medium tracking-tight md:text-5xl">Ready in a minute</h2>
                    <p className="text-muted-foreground mt-4 text-lg">Three steps for you, two for your guests.</p>
                </div>
                <ol className="mt-14 grid gap-6 md:grid-cols-3">
                    {[
                        {
                            icon: Link2,
                            title: 'Paste product links',
                            text: 'We fetch the name and photo automatically. Add notes like size or color, and flag your most wanted.',
                        },
                        {
                            icon: Gift,
                            title: 'Share one link',
                            text: 'Text it, email it, or add it to your invitation. Keep it public, link-only, or password protected.',
                        },
                        {
                            icon: ShoppingBag,
                            title: 'Guests shop anywhere',
                            text: 'They buy from the store of their choice, then mark it purchased so nobody doubles up.',
                        },
                    ].map(({ icon: Icon, title, text }, i) => (
                        <li key={title} className="bg-card relative rounded-3xl border p-7 shadow-xs">
                            <span className="font-display text-muted-foreground/20 absolute top-5 right-6 text-6xl font-semibold">{i + 1}</span>
                            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                                <Icon className="size-5" />
                            </span>
                            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                            <p className="text-muted-foreground mt-2 leading-relaxed">{text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Features */}
            <section className="bg-foreground text-background">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
                    <div className="max-w-2xl">
                        <h2 className="font-display text-4xl font-medium tracking-tight md:text-5xl">Thoughtful details, for givers and getters</h2>
                        <p className="mt-4 text-lg opacity-70">Everything a modern gift list should do, nothing it shouldn’t.</p>
                    </div>
                    <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title}>
                                <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                    <Icon className="size-5" />
                                </span>
                                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                <p className="mt-2 leading-relaxed opacity-70">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Wish list vs registry */}
            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
                <div className="grid gap-6 md:grid-cols-2">
                    {[
                        {
                            theme: 'dusk',
                            title: 'Wish lists',
                            cta: 'Create a wish list',
                            text: 'For birthdays, holidays and everything in between.',
                            points: ['Add anything from any store', 'Flag your most wanted', 'Share with a link or password'],
                            type: 'wishlist',
                        },
                        {
                            theme: 'blush',
                            title: 'Registries',
                            cta: 'Create a registry',
                            text: 'For weddings, babies, graduations and new homes.',
                            points: [
                                'Ask for quantities (“8 dinner plates”)',
                                'Event date with a countdown',
                                'Shipping address, revealed on request',
                            ],
                            type: 'registry',
                        },
                    ].map((card) => (
                        <div key={card.title} className="bg-card overflow-hidden rounded-3xl border shadow-xs">
                            <ListCover themeKey={card.theme} className="p-8">
                                <h3 className="font-display text-3xl font-medium">{card.title}</h3>
                                <p className="mt-2 opacity-80">{card.text}</p>
                            </ListCover>
                            <div className="p-8">
                                <ul className="space-y-3">
                                    {card.points.map((p) => (
                                        <li key={p} className="flex items-center gap-3">
                                            <Check className="text-success size-5 shrink-0" /> {p}
                                        </li>
                                    ))}
                                </ul>
                                <Button className="mt-8" variant="outline" asChild>
                                    <Link href={auth.user ? route('lists.create', { type: card.type }) : route('register')}>
                                        {card.cta} <ArrowRight />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-4 pb-24 sm:px-6">
                <div
                    className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white md:py-20"
                    style={{ background: 'linear-gradient(135deg, #2a1660 0%, #4c2fa0 55%, #e9877c 130%)' }}
                >
                    <div className="bg-grain absolute inset-0 opacity-40" />
                    <div className="relative">
                        <h2 className="font-display mx-auto max-w-2xl text-4xl font-medium tracking-tight text-balance md:text-5xl">
                            Make gifting the easy part.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                            Create your first list in under a minute. Free, forever, for list makers and gift givers.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button size="lg" className="h-12 bg-white px-6 text-base text-black hover:bg-white/90" asChild>
                                <Link href={ctaHref}>
                                    Get started <ArrowRight />
                                </Link>
                            </Button>
                            <span className="flex items-center gap-2 text-sm text-white/75">
                                <Smartphone className="size-4" /> Add it to your home screen like an app
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function HeroVisual() {
    const items = [
        { title: 'Cast-iron Dutch oven, 5.5 qt', store: 'Target', wanted: true, done: false, hue: '#f6c3b5' },
        { title: 'Linen duvet set, queen', store: 'Crate & Barrel', wanted: false, done: true, hue: '#d4e2cd' },
        { title: 'Espresso machine', store: 'Best Buy', wanted: true, done: false, hue: '#d9d0f6' },
    ];

    return (
        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
            <div className="bg-card relative rotate-1 overflow-hidden rounded-3xl border shadow-2xl">
                <ListCover themeKey="blush" className="px-6 py-7">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-70">Registry · Sam & Alex</p>
                    <p className="font-display mt-1 text-2xl font-medium">Our Wedding</p>
                    <p className="mt-1 text-sm opacity-80">June 12, 2027 · 216 days to go</p>
                </ListCover>
                <ul className="divide-y">
                    {items.map((it) => (
                        <li key={it.title} className="flex items-center gap-4 p-4">
                            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl" style={{ background: it.hue }}>
                                <Gift className="size-6 text-black/40" strokeWidth={1.5} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{it.store}</p>
                                <p className={`truncate text-sm font-medium ${it.done ? 'text-muted-foreground line-through' : ''}`}>{it.title}</p>
                            </div>
                            {it.done ? (
                                <span className="bg-success-soft text-success rounded-full px-2.5 py-1 text-xs font-semibold">Purchased</span>
                            ) : it.wanted ? (
                                <span className="bg-brand text-brand-foreground inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold">
                                    <Heart className="size-3 fill-current" /> Most wanted
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-card absolute -bottom-6 -left-4 flex -rotate-2 items-center gap-3 rounded-2xl border p-3 pr-5 shadow-xl sm:-left-10">
                <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-full">
                    <EyeOff className="size-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold">Surprise protected</p>
                    <p className="text-muted-foreground text-xs">You won’t see who bought what</p>
                </div>
            </div>
            <div className="bg-card absolute -top-5 -right-2 flex rotate-3 items-center gap-2 rounded-2xl border px-3 py-2 shadow-xl sm:-right-6">
                <MapPin className="text-brand size-4" />
                <span className="text-xs font-medium">Ships to the couple</span>
            </div>
        </div>
    );
}
