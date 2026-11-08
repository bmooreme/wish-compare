import { MostWantedBadge } from '@/components/lists/badges';
import { ItemFields, type ItemFormData } from '@/components/lists/item-fields';
import { ItemImage } from '@/components/lists/item-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type OwnerItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { ChevronDown, ExternalLink, Eye, EyeOff, GripVertical, Heart, LoaderCircle, MoreHorizontal, PackageCheck, Pencil, Trash2 } from 'lucide-react';
import { useState, type DragEvent } from 'react';

interface Props {
    item: OwnerItem;
    listId: number;
    isRegistry: boolean;
    dragProps: {
        draggable: boolean;
        onDragStart: (e: DragEvent) => void;
        onDragOver: (e: DragEvent) => void;
        onDrop: (e: DragEvent) => void;
        onDragEnd: () => void;
        isDragging: boolean;
        isOver: boolean;
    };
}

export function OwnerItemRow({ item, listId, isRegistry, dragProps }: Props) {
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showPurchases, setShowPurchases] = useState(false);

    const patch = (data: Partial<Pick<OwnerItem, 'most_wanted' | 'show_status'>>) =>
        router.patch(route('items.update', [listId, item.id]), data, { preserveScroll: true, preserveState: true });

    const { isDragging, isOver, ...dnd } = dragProps;

    return (
        <li
            {...dnd}
            className={cn(
                'bg-card group relative rounded-2xl border shadow-xs transition',
                isDragging && 'opacity-40',
                isOver && 'ring-primary ring-2',
            )}
        >
            <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="text-muted-foreground/50 hover:text-muted-foreground hidden cursor-grab items-center sm:flex" title="Drag to reorder" aria-hidden="true">
                    <GripVertical className="size-5" />
                </div>
                <ItemImage src={item.image_url} alt={item.title} className="size-20 shrink-0 rounded-xl sm:size-24" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                {item.most_wanted && <MostWantedBadge />}
                                {item.store_name && <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{item.store_name}</span>}
                            </div>
                            <h3 className="line-clamp-2 leading-snug font-medium">{item.title}</h3>
                            {item.notes && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{item.notes}</p>}
                        </div>
                        <div className="flex shrink-0 items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => patch({ most_wanted: !item.most_wanted })}
                                aria-pressed={item.most_wanted}
                                aria-label={item.most_wanted ? 'Remove most wanted' : 'Mark most wanted'}
                                title={item.most_wanted ? 'Remove most wanted' : 'Mark most wanted'}
                            >
                                <Heart className={cn(item.most_wanted && 'fill-brand text-brand')} />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Item options">
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setEditing(true)}>
                                        <Pencil /> Edit
                                    </DropdownMenuItem>
                                    {item.url && (
                                        <DropdownMenuItem asChild>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink /> Open product page
                                            </a>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="text-destructive focus:text-destructive">
                                        <Trash2 /> Remove
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isRegistry && <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">Wants {item.quantity}</span>}
                        <button
                            type="button"
                            onClick={() => patch({ show_status: !item.show_status })}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                                item.show_status ? 'border-primary/30 bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                            )}
                            title={item.show_status ? 'Hide purchase status from me (keep it a surprise)' : 'Show me whether this was purchased'}
                        >
                            {item.show_status ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                            {item.show_status ? 'Status visible to you' : 'Surprise: status hidden'}
                        </button>
                        {item.status && <StatusPill item={item} />}
                        {item.status && item.purchases.length > 0 && (
                            <button type="button" onClick={() => setShowPurchases((v) => !v)} className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline">
                                Purchase details <ChevronDown className={cn('size-3.5 transition', showPurchases && 'rotate-180')} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showPurchases && item.purchases.length > 0 && (
                <div className="border-t px-4 py-3 sm:pl-36">
                    <ul className="divide-y text-sm">
                        {item.purchases.map((p) => (
                            <li key={p.id} className="grid gap-1 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                                <div>
                                    <p className="font-medium">
                                        {p.buyer_name} <span className="text-muted-foreground font-normal">· {p.buyer_email}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Order <span className="text-foreground font-mono">{p.order_number}</span>
                                        {p.store && <> · {p.store}</>}
                                        {isRegistry && <> · Qty {p.quantity}</>}
                                    </p>
                                </div>
                                <time className="text-muted-foreground text-xs">{new Date(p.purchased_at).toLocaleDateString()}</time>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {editing && <EditItemDialog open={editing} onOpenChange={setEditing} item={item} listId={listId} isRegistry={isRegistry} />}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogTitle>Remove this item?</DialogTitle>
                    <DialogDescription>“{item.title}” and any purchase records for it will be removed from your list.</DialogDescription>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => router.delete(route('items.destroy', [listId, item.id]), { preserveScroll: true })}>
                            Remove item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </li>
    );
}

function StatusPill({ item }: { item: OwnerItem }) {
    const status = item.status!;
    if (status.complete) {
        return (
            <span className="bg-success-soft text-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                <PackageCheck className="size-3.5" /> Purchased{item.quantity > 1 && ` (${status.purchased}/${item.quantity})`}
            </span>
        );
    }
    if (status.purchased > 0) {
        return (
            <span className="bg-success-soft text-success rounded-full px-2.5 py-1 text-xs font-semibold">
                {status.purchased} of {item.quantity} purchased
            </span>
        );
    }
    return <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">Not purchased yet</span>;
}

function EditItemDialog({ open, onOpenChange, item, listId, isRegistry }: { open: boolean; onOpenChange: (v: boolean) => void; item: OwnerItem; listId: number; isRegistry: boolean }) {
    const form = useForm<ItemFormData>({
        title: item.title,
        url: item.url ?? '',
        image_url: item.image_url ?? '',
        identifier: item.identifier ?? '',
        notes: item.notes ?? '',
        quantity: item.quantity,
        most_wanted: item.most_wanted,
    });

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('items.update', [listId, item.id]), { preserveScroll: true, onSuccess: () => onOpenChange(false) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <form onSubmit={save} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Edit item</DialogTitle>
                        <DialogDescription>Changes appear on your shared list right away.</DialogDescription>
                    </DialogHeader>
                    <ItemFields data={form.data} setData={form.setData} errors={form.errors} isRegistry={isRegistry} idPrefix={`edit-${item.id}`} />
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <LoaderCircle className="animate-spin" />} Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
