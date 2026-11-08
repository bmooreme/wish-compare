import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function LegalPage({ title, updated, children }: PropsWithChildren<{ title: string; updated: string }>) {
    return (
        <PublicLayout>
            <Head title={title} />
            <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
                <h1 className="font-display text-4xl font-medium tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">Last updated {updated}</p>
                <div className="text-foreground/90 [&_h2]:font-display [&_a]:text-primary mt-10 space-y-5 leading-relaxed [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
                    {children}
                </div>
            </article>
        </PublicLayout>
    );
}
