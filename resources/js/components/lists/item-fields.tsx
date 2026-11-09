import { Field } from '@/components/lists/list-form';
import { PhotoPicker, usePhotoSearch } from '@/components/lists/photo-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Heart, ImagePlus } from 'lucide-react';
import { useState } from 'react';

export type ItemFormData = {
    title: string;
    url: string;
    image_url: string;
    identifier: string;
    notes: string;
    quantity: number;
    most_wanted: boolean;
};

export const emptyItem: ItemFormData = { title: '', url: '', image_url: '', identifier: '', notes: '', quantity: 1, most_wanted: false };

interface Props {
    data: ItemFormData;
    setData: <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => void;
    errors: Partial<Record<keyof ItemFormData, string>>;
    isRegistry: boolean;
    idPrefix: string;
    showUrl?: boolean;
}

export function ItemFields({ data, setData, errors, isRegistry, idPrefix, showUrl = true }: Props) {
    const photoSearch = usePhotoSearch();
    const [picking, setPicking] = useState(false);

    return (
        <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Item name" htmlFor={`${idPrefix}-title`} error={errors.title} className="sm:col-span-6">
                <Input id={`${idPrefix}-title`} value={data.title} onChange={(e) => setData('title', e.target.value)} required maxLength={255} />
            </Field>
            {showUrl && (
                <Field label="Product link" hint="Optional" htmlFor={`${idPrefix}-url`} error={errors.url} className="sm:col-span-6">
                    <Input
                        id={`${idPrefix}-url`}
                        type="url"
                        value={data.url}
                        onChange={(e) => setData('url', e.target.value)}
                        placeholder="https://"
                    />
                </Field>
            )}
            <Field label="Image link" hint="Optional" htmlFor={`${idPrefix}-image`} error={errors.image_url} className="sm:col-span-4">
                <div className="flex gap-2">
                    <Input
                        id={`${idPrefix}-image`}
                        type="url"
                        value={data.image_url}
                        onChange={(e) => setData('image_url', e.target.value)}
                        placeholder="https://"
                    />
                    {photoSearch && (
                        <Button type="button" variant="outline" onClick={() => setPicking(true)} disabled={!data.title.trim()} className="shrink-0">
                            <ImagePlus /> Find a photo
                        </Button>
                    )}
                </div>
                {photoSearch && (
                    <PhotoPicker
                        open={picking}
                        onOpenChange={setPicking}
                        title={data.title}
                        identifier={data.identifier}
                        current={data.image_url || null}
                        onSelect={(url) => setData('image_url', url ?? '')}
                    />
                )}
            </Field>
            <Field label="UPC / ISBN" hint="Optional" htmlFor={`${idPrefix}-identifier`} error={errors.identifier} className="sm:col-span-2">
                <Input
                    id={`${idPrefix}-identifier`}
                    value={data.identifier}
                    onChange={(e) => setData('identifier', e.target.value)}
                    inputMode="numeric"
                />
            </Field>
            <Field
                label="Notes for gift givers"
                hint="Size, color, edition…"
                htmlFor={`${idPrefix}-notes`}
                error={errors.notes}
                className="sm:col-span-6"
            >
                <Textarea id={`${idPrefix}-notes`} rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} maxLength={1000} />
            </Field>
            {isRegistry && (
                <Field label="Quantity wanted" htmlFor={`${idPrefix}-qty`} error={errors.quantity} className="sm:col-span-2">
                    <Input
                        id={`${idPrefix}-qty`}
                        type="number"
                        min={1}
                        max={99}
                        value={data.quantity}
                        onChange={(e) => setData('quantity', Math.max(1, Number(e.target.value) || 1))}
                    />
                </Field>
            )}
            <label
                htmlFor={`${idPrefix}-mw`}
                className="bg-brand-soft/60 flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 sm:col-span-6"
            >
                <span className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="text-brand size-4 fill-current" /> Mark as most wanted
                </span>
                <Switch id={`${idPrefix}-mw`} checked={data.most_wanted} onCheckedChange={(v) => setData('most_wanted', v)} />
            </label>
        </div>
    );
}
