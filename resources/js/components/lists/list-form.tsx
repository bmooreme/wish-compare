import InputError from '@/components/input-error';
import { privacyMeta } from '@/components/lists/badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { themes, type ThemeKey } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { type ListType, type Privacy, type ShippingAddress } from '@/types';
import { useForm } from '@inertiajs/react';
import { Check, Gift, LoaderCircle, Sparkles } from 'lucide-react';
import { type FormEventHandler, type ReactNode } from 'react';

export type ListFormData = {
    type: ListType;
    title: string;
    description: string;
    event_date: string;
    theme: string;
    privacy: Privacy;
    access_password: string;
    notify_on_purchase: boolean;
    shipping_enabled: boolean;
    shipping_address: ShippingAddress;
};

interface Props {
    initial: ListFormData;
    action: { method: 'post' | 'put'; url: string };
    submitLabel: string;
    hasPassword?: boolean;
    lockType?: boolean;
}

export function ListForm({ initial, action, submitLabel, hasPassword = false, lockType = false }: Props) {
    const { data, setData, submit, processing, errors } = useForm<ListFormData>(initial);
    const isRegistry = data.type === 'registry';
    const err = errors as Record<string, string | undefined>;

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        submit(action.method, action.url, { preserveScroll: true });
    };

    const setAddress = (field: keyof ShippingAddress, value: string) => setData('shipping_address', { ...data.shipping_address, [field]: value });

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {!lockType && (
                <Section title="What are you making?">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ChoiceCard
                            selected={data.type === 'wishlist'}
                            onSelect={() => setData('type', 'wishlist')}
                            icon={<Sparkles className="size-5" />}
                            title="Wish list"
                            description="Simple and personal: birthdays, holidays, anytime."
                        />
                        <ChoiceCard
                            selected={data.type === 'registry'}
                            onSelect={() => setData('type', 'registry')}
                            icon={<Gift className="size-5" />}
                            title="Registry"
                            description="Quantities, an event date and an optional shipping address."
                        />
                    </div>
                </Section>
            )}

            <Section title="Details">
                <div className="grid gap-5">
                    <Field label="List name" error={errors.title} htmlFor="title">
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder={isRegistry ? 'Taylor & Morgan’s Wedding' : 'My birthday wish list'}
                            required
                            maxLength={120}
                        />
                    </Field>
                    <Field label="A note for your guests" hint="Optional" error={errors.description} htmlFor="description">
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Sizes, favorite colors, or a thank-you note…"
                            rows={3}
                            maxLength={2000}
                        />
                    </Field>
                    <Field label={isRegistry ? 'Event date' : 'Occasion date'} hint="Optional" error={errors.event_date} htmlFor="event_date">
                        <Input
                            id="event_date"
                            type="date"
                            value={data.event_date}
                            onChange={(e) => setData('event_date', e.target.value)}
                            className="sm:max-w-56"
                        />
                    </Field>
                    <div className="space-y-2">
                        <Label>Cover</Label>
                        <div className="flex flex-wrap gap-3">
                            {(Object.keys(themes) as ThemeKey[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setData('theme', key)}
                                    aria-label={themes[key].label}
                                    aria-pressed={data.theme === key}
                                    className={cn(
                                        'ring-offset-background relative size-12 rounded-full shadow-inner transition',
                                        data.theme === key ? 'ring-primary ring-2 ring-offset-2' : 'hover:scale-105',
                                    )}
                                    style={{ background: themes[key].gradient }}
                                >
                                    {data.theme === key && <Check className="absolute inset-0 m-auto size-5" style={{ color: themes[key].ink }} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Who can see it?">
                <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.keys(privacyMeta) as Privacy[]).map((key) => {
                        const meta = privacyMeta[key];
                        const Icon = meta.icon;
                        return (
                            <ChoiceCard
                                key={key}
                                selected={data.privacy === key}
                                onSelect={() => setData('privacy', key)}
                                icon={<Icon className="size-5" />}
                                title={meta.label}
                                description={meta.hint}
                            />
                        );
                    })}
                </div>
                {data.privacy === 'password' && (
                    <Field
                        label={hasPassword ? 'Change password' : 'List password'}
                        hint={hasPassword ? 'Leave blank to keep the current password' : 'Share it with your guests along with the link'}
                        error={errors.access_password}
                        htmlFor="access_password"
                        className="mt-4 sm:max-w-sm"
                    >
                        <Input
                            id="access_password"
                            type="text"
                            autoComplete="off"
                            value={data.access_password}
                            onChange={(e) => setData('access_password', e.target.value)}
                            placeholder="At least 4 characters"
                        />
                    </Field>
                )}
            </Section>

            <Section title="Notifications">
                <ToggleRow
                    id="notify"
                    checked={data.notify_on_purchase}
                    onChange={(v) => setData('notify_on_purchase', v)}
                    title="Email me when a gift is purchased"
                    description="If an item’s purchase status is hidden, the email won’t say what was bought or who bought it."
                />
            </Section>

            {isRegistry && (
                <Section title="Shipping address">
                    <ToggleRow
                        id="shipping"
                        checked={data.shipping_enabled}
                        onChange={(v) => setData('shipping_enabled', v)}
                        title="Let guests request my shipping address"
                        description="Your address is never shown on the list itself. Guests must click “Show shipping address” to see it."
                    />
                    {data.shipping_enabled && (
                        <div className="mt-5 grid gap-4 sm:grid-cols-6">
                            <Field label="Recipient name" className="sm:col-span-6" htmlFor="ship_name" error={err['shipping_address.name']}>
                                <Input
                                    id="ship_name"
                                    value={data.shipping_address.name ?? ''}
                                    onChange={(e) => setAddress('name', e.target.value)}
                                    autoComplete="name"
                                />
                            </Field>
                            <Field label="Street address" className="sm:col-span-6" htmlFor="ship_line1" error={err['shipping_address.line1']}>
                                <Input
                                    id="ship_line1"
                                    value={data.shipping_address.line1 ?? ''}
                                    onChange={(e) => setAddress('line1', e.target.value)}
                                    autoComplete="address-line1"
                                />
                            </Field>
                            <Field
                                label="Apt, suite, etc."
                                hint="Optional"
                                className="sm:col-span-6"
                                htmlFor="ship_line2"
                                error={err['shipping_address.line2']}
                            >
                                <Input
                                    id="ship_line2"
                                    value={data.shipping_address.line2 ?? ''}
                                    onChange={(e) => setAddress('line2', e.target.value)}
                                    autoComplete="address-line2"
                                />
                            </Field>
                            <Field label="City" className="sm:col-span-3" htmlFor="ship_city" error={err['shipping_address.city']}>
                                <Input
                                    id="ship_city"
                                    value={data.shipping_address.city ?? ''}
                                    onChange={(e) => setAddress('city', e.target.value)}
                                    autoComplete="address-level2"
                                />
                            </Field>
                            <Field label="State" className="sm:col-span-1" htmlFor="ship_state" error={err['shipping_address.state']}>
                                <Input
                                    id="ship_state"
                                    value={data.shipping_address.state ?? ''}
                                    onChange={(e) => setAddress('state', e.target.value)}
                                    autoComplete="address-level1"
                                    maxLength={40}
                                />
                            </Field>
                            <Field label="ZIP" className="sm:col-span-2" htmlFor="ship_zip" error={err['shipping_address.postal_code']}>
                                <Input
                                    id="ship_zip"
                                    value={data.shipping_address.postal_code ?? ''}
                                    onChange={(e) => setAddress('postal_code', e.target.value)}
                                    autoComplete="postal-code"
                                    inputMode="numeric"
                                    maxLength={12}
                                />
                            </Field>
                        </div>
                    )}
                </Section>
            )}

            <div className="bg-background/90 sticky bottom-0 -mx-4 flex justify-end gap-3 border-t px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
                <Button type="submit" size="lg" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="bg-card rounded-2xl border p-5 shadow-xs md:p-6">
            <h2 className="mb-4 text-base font-semibold">{title}</h2>
            {children}
        </section>
    );
}

export function Field({
    label,
    hint,
    error,
    htmlFor,
    className,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    htmlFor?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={htmlFor}>{label}</Label>
                {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
            </div>
            {children}
            <InputError message={error} />
        </div>
    );
}

function ChoiceCard({
    selected,
    onSelect,
    icon,
    title,
    description,
}: {
    selected: boolean;
    onSelect: () => void;
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition',
                selected ? 'border-primary bg-accent ring-primary/30 ring-2' : 'hover:border-foreground/30 hover:bg-muted/50',
            )}
        >
            <span
                className={cn(
                    'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
            >
                {icon}
            </span>
            <span>
                <span className="block font-medium">{title}</span>
                <span className="text-muted-foreground mt-0.5 block text-sm">{description}</span>
            </span>
        </button>
    );
}

export function ToggleRow({
    id,
    checked,
    onChange,
    title,
    description,
}: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start justify-between gap-6">
            <label htmlFor={id} className="cursor-pointer">
                <span className="block font-medium">{title}</span>
                <span className="text-muted-foreground mt-0.5 block text-sm">{description}</span>
            </label>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
