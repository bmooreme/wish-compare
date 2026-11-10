import { ListForm } from '@/components/lists/list-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type ListSummary, type ShippingAddress } from '@/types';
import { Head, router } from '@inertiajs/react';
import { RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    list: ListSummary & { notify_on_purchase: boolean; shipping_enabled: boolean; shipping_address: ShippingAddress; has_password: boolean };
}

export default function ListSettings({ list }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My lists', href: '/dashboard' },
                { title: list.title, href: route('lists.show', list.id) },
                { title: 'Settings', href: route('lists.edit', list.id) },
            ]}
        >
            <Head title={`Settings · ${list.title}`} />
            <div className="mx-auto w-full max-w-3xl space-y-8 p-4 md:p-8">
                <div>
                    <h1 className="font-display text-3xl font-medium tracking-tight">List settings</h1>
                    <p className="text-muted-foreground mt-1">{list.title}</p>
                </div>

                <ListForm
                    lockType={false}
                    hasPassword={list.has_password}
                    action={{ method: 'put', url: route('lists.update', list.id) }}
                    submitLabel="Save changes"
                    initial={{
                        type: list.type,
                        title: list.title,
                        description: list.description ?? '',
                        event_date: list.event_date ?? '',
                        theme: list.theme,
                        privacy: list.privacy,
                        access_password: '',
                        notify_on_purchase: list.notify_on_purchase,
                        shipping_enabled: list.shipping_enabled,
                        shipping_address: list.shipping_address ?? {},
                    }}
                />

                <section className="border-destructive/30 space-y-5 rounded-2xl border p-5 md:p-6">
                    <h2 className="text-base font-semibold">Link & danger zone</h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-medium">Reset share link</p>
                            <p className="text-muted-foreground text-sm">Creates a new link. Anyone using the old one loses access.</p>
                        </div>
                        <Button variant="outline" onClick={() => router.post(route('lists.share-link', list.id), {}, { preserveScroll: true })}>
                            <RefreshCw /> New link
                        </Button>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-medium">Delete this list</p>
                            <p className="text-muted-foreground text-sm">
                                Removes the list, its items and all purchase records. This can’t be undone.
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 /> Delete list
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Delete “{list.title}”?</DialogTitle>
                                <DialogDescription>Guests will no longer be able to open it, and purchase records will be erased.</DialogDescription>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button variant="destructive" onClick={() => router.delete(route('lists.destroy', list.id))}>
                                        Delete forever
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
