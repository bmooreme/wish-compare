import { emptyItem, ItemFields, type ItemFormData } from '@/components/lists/item-fields';
import { ItemImage } from '@/components/lists/item-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postJson } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { Link2, LoaderCircle, PencilLine, Plus, Wand2, X } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

interface Preview {
    url: string;
    title: string | null;
    image_url: string | null;
    identifier: string | null;
    store_name: string | null;
}

export function AddItem({ listId, isRegistry }: { listId: number; isRegistry: boolean }) {
    const [link, setLink] = useState('');
    const [stage, setStage] = useState<'idle' | 'loading' | 'editing'>('idle');
    const [storeName, setStoreName] = useState<string | null>(null);
    const [lookupFailed, setLookupFailed] = useState(false);
    const form = useForm<ItemFormData>({ ...emptyItem });

    const fetchDetails: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!link.trim()) return;
        let url = link.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

        setStage('loading');
        setLookupFailed(false);
        try {
            const preview = await postJson<Preview>(route('items.preview'), { url });
            form.setData({
                ...emptyItem,
                url: preview.url,
                title: preview.title ?? '',
                image_url: preview.image_url ?? '',
                identifier: preview.identifier ?? '',
            });
            setStoreName(preview.store_name);
            setLookupFailed(!preview.title);
        } catch {
            form.setData({ ...emptyItem, url });
            setLookupFailed(true);
        }
        setStage('editing');
    };

    const startManual = () => {
        form.setData({ ...emptyItem });
        setStoreName(null);
        setLookupFailed(false);
        setStage('editing');
    };

    const reset = () => {
        form.reset();
        form.clearErrors();
        setLink('');
        setStage('idle');
    };

    const save: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('items.store', listId), { preserveScroll: true, onSuccess: reset });
    };

    return (
        <section className="bg-card rounded-2xl border p-4 shadow-xs md:p-5">
            {stage !== 'editing' ? (
                <div className="space-y-3">
                    <form onSubmit={fetchDetails} className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Link2 className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="Paste a product link from any store"
                                className="h-11 pl-9"
                                inputMode="url"
                                aria-label="Product link"
                            />
                        </div>
                        <Button type="submit" size="lg" className="h-11" disabled={stage === 'loading' || !link.trim()}>
                            {stage === 'loading' ? <LoaderCircle className="animate-spin" /> : <Wand2 />}
                            {stage === 'loading' ? 'Fetching details…' : 'Add item'}
                        </Button>
                    </form>
                    <p className="text-muted-foreground text-sm">
                        We’ll grab the name and photo for you.{' '}
                        <button type="button" onClick={startManual} className="text-primary inline-flex items-center gap-1 font-medium hover:underline">
                            <PencilLine className="size-3.5" /> Or add one by hand
                        </button>
                    </p>
                </div>
            ) : (
                <form onSubmit={save} className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <ItemImage src={form.data.image_url || null} alt="" className="size-16 shrink-0 rounded-xl border" />
                            <div>
                                <h3 className="font-semibold">New item</h3>
                                <p className="text-muted-foreground text-sm">
                                    {lookupFailed
                                        ? 'We couldn’t read that page automatically. Fill in the details below.'
                                        : storeName
                                          ? `From ${storeName}. Review the details, then save.`
                                          : 'Fill in the details below.'}
                                </p>
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={reset} aria-label="Cancel">
                            <X />
                        </Button>
                    </div>
                    <ItemFields data={form.data} setData={form.setData} errors={form.errors} isRegistry={isRegistry} idPrefix="new" />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={reset}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? <LoaderCircle className="animate-spin" /> : <Plus />} Save item
                        </Button>
                    </div>
                </form>
            )}
        </section>
    );
}
