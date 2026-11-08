import { ItemImage } from '@/components/lists/item-image';
import { Field } from '@/components/lists/list-form';
import { ListCover } from '@/components/lists/list-cover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PublicLayout from '@/layouts/public-layout';
import { type StoreChoice } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Undo2 } from 'lucide-react';

interface Props {
    purchase: { id: number; buyer_name: string; buyer_email: string; order_number: string; store_key: string | null; quantity: number; purchased_at: string };
    item: { title: string; image_url: string | null; max_quantity: number; is_registry: boolean };
    list: { title: string; owner_name: string | null; share_url: string; theme: string };
    token: string;
    stores: StoreChoice[];
}

export default function ManagePurchase({ purchase, item, list, token, stores }: Props) {
    const form = useForm({
        token,
        buyer_name: purchase.buyer_name,
        buyer_email: purchase.buyer_email,
        order_number: purchase.order_number,
        store_key: purchase.store_key ?? '',
        quantity: purchase.quantity,
    });

    return (
        <PublicLayout>
            <Head title="Your purchase">
                <meta name="robots" content="noindex" />
            </Head>
            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16">
                <a href={list.share_url} className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm">
                    <ArrowLeft className="size-4" /> Back to {list.title}
                </a>
                <div className="bg-card overflow-hidden rounded-3xl border shadow-sm">
                    <ListCover themeKey={list.theme} className="p-6">
                        <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-75">Your purchase</p>
                        <h1 className="font-display mt-1 text-2xl font-medium">Gift for {list.owner_name ?? list.title}</h1>
                    </ListCover>
                    <div className="space-y-6 p-6">
                        <div className="flex items-center gap-4">
                            <ItemImage src={item.image_url} alt="" className="size-20 shrink-0 rounded-xl bg-white" />
                            <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-muted-foreground text-sm">Marked purchased on {new Date(purchase.purchased_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                            </div>
                        </div>

                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(route('purchases.update', purchase.id), { preserveScroll: true });
                            }}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Your name" htmlFor="buyer_name" error={form.errors.buyer_name}>
                                    <Input id="buyer_name" value={form.data.buyer_name} onChange={(e) => form.setData('buyer_name', e.target.value)} required />
                                </Field>
                                <Field label="Email used for the order" htmlFor="buyer_email" error={form.errors.buyer_email}>
                                    <Input id="buyer_email" type="email" value={form.data.buyer_email} onChange={(e) => form.setData('buyer_email', e.target.value)} required />
                                </Field>
                                <Field label="Store" htmlFor="store_key" error={form.errors.store_key}>
                                    <Select value={form.data.store_key} onValueChange={(v) => form.setData('store_key', v)}>
                                        <SelectTrigger id="store_key">
                                            <SelectValue placeholder="Select a store" />
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
                                    <Input id="order_number" value={form.data.order_number} onChange={(e) => form.setData('order_number', e.target.value)} required />
                                </Field>
                                {item.is_registry && item.max_quantity > 1 && (
                                    <Field label={`Quantity (up to ${item.max_quantity})`} htmlFor="quantity" error={form.errors.quantity}>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min={1}
                                            max={item.max_quantity}
                                            value={form.data.quantity}
                                            onChange={(e) => form.setData('quantity', Math.max(1, Number(e.target.value) || 1))}
                                        />
                                    </Field>
                                )}
                            </div>
                            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
                                            <Undo2 /> I didn’t buy this / returned it
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogTitle>Remove this purchase?</DialogTitle>
                                        <DialogDescription>The item will show as available again so someone else can buy it.</DialogDescription>
                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button variant="outline">Keep it</Button>
                                            </DialogClose>
                                            <Button variant="destructive" onClick={() => router.delete(route('purchases.destroy', purchase.id), { data: { token } })}>
                                                Remove purchase
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing && <LoaderCircle className="animate-spin" />} Save changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                <p className="text-muted-foreground mt-6 text-center text-xs">Keep your confirmation email: this private link is the only way to change this purchase.</p>
            </div>
        </PublicLayout>
    );
}
