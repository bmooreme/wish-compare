import InputError from '@/components/input-error';
import { ItemImage } from '@/components/lists/item-image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { postJson } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type ListType } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ClipboardPaste, Heart, Info, LoaderCircle, RotateCcw, Smartphone, Sparkles } from 'lucide-react';
import { useMemo, useState, type ClipboardEvent } from 'react';

interface ParsedItem {
    asin: string;
    title: string;
    url: string;
    image_url: string | null;
    quantity: number;
    most_wanted: boolean;
    notes: string | null;
    duplicate: boolean;
}

interface Row extends ParsedItem {
    selected: boolean;
}

interface Props {
    lists: { id: number; title: string; type: ListType }[];
    selectedListId: number | null;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

/** Shrinks pasted HTML before upload: inline styles and scripts are never needed. */
function compact(html: string) {
    return html
        .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, '')
        .replace(/\s(style|class|data-(?!src)[\w-]+|aria-[\w-]+)="[^"]*"/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
}

export default function ImportAmazon({ lists, selectedListId }: Props) {
    const [destination, setDestination] = useState<'existing' | 'new'>(lists.length > 0 ? 'existing' : 'new');
    const [listId, setListId] = useState<string>(String(selectedListId ?? lists[0]?.id ?? ''));
    const [newTitle, setNewTitle] = useState('My Amazon wish list');
    const [newType, setNewType] = useState<ListType>('wishlist');
    const [mode, setMode] = useState<'paste' | 'links'>('paste');
    const [links, setLinks] = useState('');
    const [rows, setRows] = useState<Row[] | null>(null);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const targetType: ListType = destination === 'new' ? newType : (lists.find((l) => String(l.id) === listId)?.type ?? 'wishlist');
    const selectedCount = rows?.filter((r) => r.selected).length ?? 0;
    const duplicateCount = rows?.filter((r) => r.duplicate).length ?? 0;
    const allSelected = useMemo(() => !!rows && rows.length > 0 && rows.every((r) => r.selected || r.duplicate), [rows]);

    const parse = async (payload: { html?: string; text?: string }) => {
        setParsing(true);
        setError(null);
        try {
            const res = await postJson<{ items: ParsedItem[] }>(route('import.amazon.parse'), {
                ...payload,
                list_id: destination === 'existing' && listId ? Number(listId) : null,
            });
            if (res.items.length === 0) {
                setError(
                    mode === 'paste'
                        ? 'We couldn’t find any Amazon items in what you pasted. Make sure you copied your list page itself (not just the link), then try again.'
                        : 'We couldn’t find any Amazon product links. Each link should look like amazon.com/…/dp/B0…',
                );
                setRows(null);
            } else {
                setRows(res.items.map((item) => ({ ...item, selected: !item.duplicate })));
            }
        } catch {
            setError('Something went wrong reading that. Please try again.');
        }
        setParsing(false);
    };

    const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        if (!html && !text) return;
        parse({ html: html ? compact(html) : undefined, text });
    };

    const update = (asin: string, patch: Partial<Row>) =>
        setRows((current) => current?.map((r) => (r.asin === asin ? { ...r, ...patch } : r)) ?? null);

    const toggleAll = (value: boolean) => setRows((current) => current?.map((r) => (r.duplicate ? r : { ...r, selected: value })) ?? null);

    const submit = () => {
        if (!rows) return;
        setSaving(true);
        router.post(
            route('import.amazon.store'),
            {
                list_id: destination === 'existing' ? Number(listId) : null,
                new_title: destination === 'new' ? newTitle : null,
                new_type: destination === 'new' ? newType : null,
                items: rows
                    .filter((r) => r.selected)
                    .map((r) => ({
                        title: r.title,
                        url: r.url,
                        image_url: r.image_url,
                        quantity: r.quantity,
                        most_wanted: r.most_wanted,
                        notes: r.notes,
                    })),
            },
            {
                onError: (errs) => setErrors(errs),
                onFinish: () => setSaving(false),
            },
        );
    };

    const firstItemError = Object.entries(errors).find(([key]) => key.startsWith('items'))?.[1];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My lists', href: '/dashboard' },
                { title: 'Import from Amazon', href: '/import/amazon' },
            ]}
        >
            <Head title="Import from Amazon" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
                <div>
                    <h1 className="font-display text-3xl font-medium tracking-tight">Import from Amazon</h1>
                    <p className="text-muted-foreground mt-1">Bring your existing Amazon wish list over in a minute. Nothing changes on Amazon.</p>
                </div>

                {/* Step 1 */}
                <Step number={1} title="Where should the items go?">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {lists.length > 0 && (
                            <Choice selected={destination === 'existing'} onSelect={() => setDestination('existing')} title="An existing list">
                                <Select value={listId} onValueChange={setListId}>
                                    <SelectTrigger className="mt-3">
                                        <SelectValue placeholder="Choose a list" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lists.map((l) => (
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                {l.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Choice>
                        )}
                        <Choice selected={destination === 'new'} onSelect={() => setDestination('new')} title="A new list">
                            <div className="mt-3 space-y-3">
                                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} aria-label="New list name" maxLength={120} />
                                <div className="bg-muted inline-flex rounded-full p-1 text-sm">
                                    {(['wishlist', 'registry'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setNewType(t)}
                                            className={cn(
                                                'rounded-full px-3 py-1 font-medium transition',
                                                newType === t ? 'bg-background shadow-sm' : 'text-muted-foreground',
                                            )}
                                        >
                                            {t === 'wishlist' ? 'Wish list' : 'Registry'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Choice>
                    </div>
                    <InputError message={errors.new_title ?? errors.list_id} className="mt-2" />
                </Step>

                {/* Step 2 */}
                <Step number={2} title="Copy your Amazon list">
                    {mode === 'paste' ? (
                        <>
                            <ol className="text-muted-foreground mb-5 space-y-2 text-sm">
                                <li>
                                    <span className="text-foreground font-medium">a.</span> On a computer, open your list on Amazon (Account → Your
                                    Lists).
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">b.</span> Scroll to the very bottom so every item loads.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">c.</span> Press <Kbd>{mod}</Kbd> + <Kbd>A</Kbd> to select the page,
                                    then <Kbd>{mod}</Kbd> + <Kbd>C</Kbd> to copy it.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">d.</span> Click the box below and press <Kbd>{mod}</Kbd> +{' '}
                                    <Kbd>V</Kbd>.
                                </li>
                            </ol>
                            <div
                                role="textbox"
                                tabIndex={0}
                                aria-label="Paste your copied Amazon list here"
                                onPaste={onPaste}
                                className="border-primary/30 bg-accent/40 hover:bg-accent/70 focus-visible:ring-ring flex min-h-40 cursor-text flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition outline-none focus-visible:ring-2"
                            >
                                {parsing ? (
                                    <>
                                        <LoaderCircle className="text-primary size-8 animate-spin" />
                                        <p className="font-medium">Reading your list…</p>
                                    </>
                                ) : (
                                    <>
                                        <ClipboardPaste className="text-primary size-8" strokeWidth={1.5} />
                                        <p className="font-medium">Click here, then paste</p>
                                        <p className="text-muted-foreground text-sm">
                                            <Kbd>{mod}</Kbd> + <Kbd>V</Kbd>
                                        </p>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setMode('links')}
                                className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                            >
                                <Smartphone className="size-4" /> On a phone? Paste product links instead
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-muted-foreground mb-3 text-sm">
                                Paste Amazon product links, one per line. In the Amazon app, open an item, tap{' '}
                                <span className="text-foreground">Share</span> → <span className="text-foreground">Copy link</span>.
                            </p>
                            <Textarea
                                rows={6}
                                value={links}
                                onChange={(e) => setLinks(e.target.value)}
                                placeholder={'https://www.amazon.com/dp/B0…\nhttps://www.amazon.com/…/dp/B0…'}
                                className="font-mono text-sm"
                            />
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <button type="button" onClick={() => setMode('paste')} className="text-primary text-sm font-medium hover:underline">
                                    ← Copy the whole list instead
                                </button>
                                <Button type="button" onClick={() => parse({ text: links })} disabled={parsing || !links.trim()}>
                                    {parsing && <LoaderCircle className="animate-spin" />} Find items
                                </Button>
                            </div>
                        </>
                    )}
                    {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
                </Step>

                {/* Step 3 */}
                {rows && (
                    <Step
                        number={3}
                        title={`Review ${rows.length} ${rows.length === 1 ? 'item' : 'items'}`}
                        action={
                            <Button variant="ghost" size="sm" onClick={() => setRows(null)}>
                                <RotateCcw /> Start over
                            </Button>
                        }
                    >
                        <div className="text-muted-foreground mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <label className="flex cursor-pointer items-center gap-2">
                                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(v === true)} /> Select all
                            </label>
                            {duplicateCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Info className="size-4" /> {duplicateCount} already on this list and will be skipped
                                </span>
                            )}
                        </div>
                        <ul className="divide-y rounded-xl border">
                            {rows.map((row) => (
                                <li key={row.asin} className={cn('flex gap-3 p-3', (!row.selected || row.duplicate) && 'opacity-55')}>
                                    <Checkbox
                                        className="mt-1"
                                        checked={row.selected}
                                        disabled={row.duplicate}
                                        onCheckedChange={(v) => update(row.asin, { selected: v === true })}
                                        aria-label={`Import ${row.title}`}
                                    />
                                    <ItemImage src={row.image_url} alt="" className="size-16 shrink-0 rounded-lg bg-white" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Input
                                            value={row.title}
                                            onChange={(e) => update(row.asin, { title: e.target.value })}
                                            disabled={row.duplicate}
                                            aria-label="Item name"
                                            className="h-9"
                                        />
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            {row.duplicate && <span className="bg-muted rounded-full px-2 py-0.5 font-medium">Already on list</span>}
                                            {targetType === 'registry' && !row.duplicate && (
                                                <label className="flex items-center gap-1.5">
                                                    Qty
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        value={row.quantity}
                                                        onChange={(e) => update(row.asin, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                                                        className="h-7 w-16 px-2 text-xs"
                                                    />
                                                </label>
                                            )}
                                            {!row.duplicate && (
                                                <button
                                                    type="button"
                                                    onClick={() => update(row.asin, { most_wanted: !row.most_wanted })}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
                                                        row.most_wanted ? 'border-brand/40 bg-brand-soft text-brand' : 'text-muted-foreground',
                                                    )}
                                                >
                                                    <Heart className={cn('size-3', row.most_wanted && 'fill-current')} /> Most wanted
                                                </button>
                                            )}
                                            {row.notes && <span className="text-muted-foreground truncate">“{row.notes}”</span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <InputError message={firstItemError} className="mt-3" />
                    </Step>
                )}

                {rows && (
                    <div className="bg-background/90 sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-4 border-t px-4 py-4 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5 md:shadow-lg">
                        <p className="text-muted-foreground text-sm">
                            <span className="text-foreground font-semibold">{selectedCount}</span> selected
                        </p>
                        <Button size="lg" onClick={submit} disabled={saving || selectedCount === 0 || (destination === 'existing' && !listId)}>
                            {saving ? <LoaderCircle className="animate-spin" /> : <Sparkles />} Import {selectedCount}{' '}
                            {selectedCount === 1 ? 'item' : 'items'}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Step({ number, title, action, children }: { number: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-card rounded-2xl border p-5 shadow-xs md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-base font-semibold">
                    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-sm">{number}</span>
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Choice({ selected, onSelect, title, children }: { selected: boolean; onSelect: () => void; title: string; children: React.ReactNode }) {
    return (
        <div
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={onSelect}
            onFocusCapture={onSelect}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
            className={cn(
                'cursor-pointer rounded-xl border p-4 transition',
                selected
                    ? 'border-primary bg-accent ring-primary/30 ring-2'
                    : 'hover:border-foreground/30 hover:bg-muted/50 [&_button]:opacity-60 [&_input]:opacity-60',
            )}
        >
            <span className="flex items-center gap-2 font-medium">
                <span className={cn('flex size-4 items-center justify-center rounded-full border', selected && 'border-primary')}>
                    {selected && <span className="bg-primary size-2 rounded-full" />}
                </span>
                {title}
            </span>
            {children}
        </div>
    );
}

function Kbd({ children }: { children: React.ReactNode }) {
    return <kbd className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-sans text-xs font-medium">{children}</kbd>;
}
