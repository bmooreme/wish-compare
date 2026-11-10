import { MostWantedBadge } from '@/components/lists/badges';
import { ItemImage } from '@/components/lists/item-image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type GuestItem } from '@/types';
import { Check, ChevronDown, ExternalLink, PackageCheck, ShoppingBag } from 'lucide-react';

interface Props {
    item: GuestItem;
    isRegistry: boolean;
    isOwner: boolean;
    onShop: (storeKey: string) => void;
    onPurchased: () => void;
}

export function GuestItemCard({ item, isRegistry, isOwner, onShop, onPurchased }: Props) {
    const { status } = item;
    const [primary, ...others] = item.shop;
    const partial = isRegistry && status.purchased > 0 && !status.complete;

    return (
        <article
            className={cn(
                'bg-card group flex flex-col overflow-hidden rounded-2xl border shadow-xs transition',
                !status.complete && 'hover:shadow-lg',
            )}
        >
            <div className="relative">
                <ItemImage
                    src={item.image_url}
                    alt={item.title}
                    className={cn(
                        'aspect-[4/3] w-full bg-white min-[480px]:aspect-square dark:bg-white/95',
                        status.complete && 'opacity-50 grayscale',
                    )}
                />
                <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">{item.most_wanted && <MostWantedBadge />}</div>
                {status.complete && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-success inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg">
                            <Check className="size-4" /> Purchased
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-1">
                    {item.store_name && <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{item.store_name}</p>}
                    <h3 className="line-clamp-2 leading-snug font-medium">{item.title}</h3>
                    {item.notes && <p className="text-muted-foreground line-clamp-3 text-sm">{item.notes}</p>}
                </div>

                {isRegistry && item.quantity > 1 && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                {status.purchased} of {item.quantity} purchased
                            </span>
                            {!status.complete && <span className="font-medium">{status.remaining} still needed</span>}
                        </div>
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                            <div
                                className="bg-success h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (status.purchased / item.quantity) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-2 pt-1">
                    {status.complete ? (
                        <p className="text-muted-foreground py-2 text-center text-sm">Someone already got this one 🎉</p>
                    ) : (
                        <>
                            {primary && (
                                <div className="flex">
                                    <Button asChild className={cn('min-w-0 flex-1', others.length > 0 && 'rounded-r-none')}>
                                        <a href={primary.href} target="_blank" rel="noopener sponsored" onClick={() => onShop(primary.key)}>
                                            <ShoppingBag /> <span className="truncate">Buy at {primary.name}</span>
                                        </a>
                                    </Button>
                                    {others.length > 0 && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    className="border-primary-foreground/20 shrink-0 rounded-l-none border-l px-2.5"
                                                    aria-label="More stores"
                                                >
                                                    <ChevronDown />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                                                    Find it at another store
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {others.map((s) => (
                                                    <DropdownMenuItem key={s.key} asChild>
                                                        <a href={s.href} target="_blank" rel="noopener sponsored" onClick={() => onShop(s.key)}>
                                                            <ExternalLink /> {s.name}
                                                        </a>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            )}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={onPurchased}
                                disabled={isOwner}
                                title={isOwner ? 'Guests use this to mark gifts as purchased' : undefined}
                            >
                                <PackageCheck /> {partial ? 'I bought some' : 'I bought this'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}
