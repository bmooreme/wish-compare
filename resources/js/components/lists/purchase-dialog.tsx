import InputError from '@/components/input-error';
import { ItemImage } from '@/components/lists/item-image';
import { Field } from '@/components/lists/list-form';
import { Turnstile } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type GuestItem, type StoreChoice } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, Lock, PackageCheck } from 'lucide-react';
import { useCallback, useEffect } from 'react';

const REMEMBER_KEY = 'wishlark.buyer';

interface Props {
    item: GuestItem | null;
    onClose: () => void;
    token: string;
    ownerName: string | null;
    isRegistry: boolean;
    stores: StoreChoice[];
    defaultStore: string | null;
    turnstileSiteKey: string | null;
}

function remembered(): { buyer_name: string; buyer_email: string } {
    try {
        const raw = window.localStorage.getItem(REMEMBER_KEY);
        if (raw) return { buyer_name: '', buyer_email: '', ...JSON.parse(raw) };
    } catch {
        /* storage unavailable */
    }
    return { buyer_name: '', buyer_email: '' };
}

export function PurchaseDialog({ item, onClose, token, ownerName, isRegistry, stores, defaultStore, turnstileSiteKey }: Props) {
    const form = useForm({
        buyer_name: '',
        buyer_email: '',
        order_number: '',
        store_key: '',
        quantity: 1,
        website: '',
        turnstile_token: '',
    });

    useEffect(() => {
        if (!item) return;
        const who = remembered();
        form.setData((data) => ({
            ...data,
            ...who,
            order_number: '',
            quantity: 1,
            store_key: defaultStore ?? (item.store_key && stores.some((s) => s.key === item.store_key) ? item.store_key : ''),
        }));
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id]);

    const setToken = useCallback((t: string) => form.setData('turnstile_token', t), [form.setData]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!item) return null;
    const remaining = item.status.remaining;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            window.localStorage.setItem(REMEMBER_KEY, JSON.stringify({ buyer_name: form.data.buyer_name, buyer_email: form.data.buyer_email }));
        } catch {
            /* ignore */
        }
        form.post(route('purchases.store', [token, item.id]), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('order_number');
                onClose();
            },
        });
    };

    return (
        <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl font-medium">Mark as purchased</DialogTitle>
                        <DialogDescription>Let everyone know this gift is taken so nobody buys it twice.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/60 flex items-center gap-3 rounded-xl p-3">
                        <ItemImage src={item.image_url} alt="" className="size-14 shrink-0 rounded-lg bg-white" />
                        <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Your name" htmlFor="buyer_name" error={form.errors.buyer_name}>
                            <Input id="buyer_name" autoComplete="name" required value={form.data.buyer_name} onChange={(e) => form.setData('buyer_name', e.target.value)} />
                        </Field>
                        <Field label="Email used for the order" htmlFor="buyer_email" error={form.errors.buyer_email}>
                            <Input
                                id="buyer_email"
                                type="email"
                                autoComplete="email"
                                required
                                value={form.data.buyer_email}
                                onChange={(e) => form.setData('buyer_email', e.target.value)}
                            />
                        </Field>
                        <Field label="Store" htmlFor="store_key" error={form.errors.store_key}>
                            <Select value={form.data.store_key} onValueChange={(v) => form.setData('store_key', v)}>
                                <SelectTrigger id="store_key">
                                    <SelectValue placeholder="Where did you buy it?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores.map((s) => (
                                        <SelectItem key={s.key} value={s.key}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Order number" htmlFor="order_number" error={form.errors.order_number}>
                            <Input id="order_number" required value={form.data.order_number} onChange={(e) => form.setData('order_number', e.target.value)} placeholder="e.g. 112-4459021" />
                        </Field>
                        {isRegistry && remaining > 1 && (
                            <Field label={`Quantity (${remaining} still needed)`} htmlFor="quantity" error={form.errors.quantity}>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    max={remaining}
                                    value={form.data.quantity}
                                    onChange={(e) => form.setData('quantity', Math.min(remaining, Math.max(1, Number(e.target.value) || 1)))}
                                />
                            </Field>
                        )}
                    </div>
                    {isRegistry && remaining <= 1 && <InputError message={form.errors.quantity} />}

                    {/* Honeypot: hidden from people, tempting to bots */}
                    <div className="absolute -left-[9999px]" aria-hidden="true">
                        <label>
                            Website
                            <input tabIndex={-1} autoComplete="off" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} />
                        </label>
                    </div>

                    <Turnstile siteKey={turnstileSiteKey} onToken={setToken} />
                    <InputError message={form.errors.turnstile_token} />

                    <p className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
                        <Lock className="mt-0.5 size-3.5 shrink-0" />
                        We’ll email you a confirmation with a private link to change or undo this. {ownerName ?? 'The list owner'} can see your name and order number
                        (for returns) only if they’ve chosen not to keep this item a surprise.
                    </p>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? <LoaderCircle className="animate-spin" /> : <PackageCheck />} Confirm purchase
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
