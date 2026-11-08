import { BrandWordmark } from '@/components/app-logo';
import { FlashToast } from '@/components/flash-toast';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { type PropsWithChildren } from 'react';

export default function PublicLayout({ children, showDisclosure = false }: PropsWithChildren<{ showDisclosure?: boolean }>) {
    const { auth, name } = usePage<SharedData>().props;

    return (
        <div className="bg-background text-foreground flex min-h-dvh flex-col">
            <header className="bg-background/80 supports-[backdrop-filter]:bg-background/65 [&:not(:first-child)]:border-border sticky top-0 z-40 border-b border-transparent backdrop-blur-lg">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link href={route('home')} aria-label={`${name} home`}>
                        <BrandWordmark />
                    </Link>
                    <nav className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('lists.find')}>
                                <Search /> <span className="hidden sm:inline">Find a list</span>
                            </Link>
                        </Button>
                        {auth.user ? (
                            <Button size="sm" asChild>
                                <Link href={route('dashboard')}>My lists</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={route('register')}>Create a list</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="space-y-2">
                        <BrandWordmark className="[&>span:last-child]:text-base" />
                        <p className="text-muted-foreground max-w-md">
                            {showDisclosure
                                ? `When you buy through store links on ${name}, we may earn a small commission at no extra cost to you. It never changes what you pay.`
                                : 'Wish lists and gift registries that work with every store.'}
                        </p>
                    </div>
                    <nav className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
                        <Link href={route('lists.find')} className="hover:text-foreground">
                            Find a list
                        </Link>
                        <Link href={route('legal.affiliate')} className="hover:text-foreground">
                            Affiliate disclosure
                        </Link>
                        <Link href={route('legal.privacy')} className="hover:text-foreground">
                            Privacy
                        </Link>
                        <Link href={route('legal.terms')} className="hover:text-foreground">
                            Terms
                        </Link>
                        <span>
                            © {new Date().getFullYear()} {name}
                        </span>
                    </nav>
                </div>
            </footer>
            <FlashToast />
        </div>
    );
}
