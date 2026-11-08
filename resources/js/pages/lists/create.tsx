import { ListForm } from '@/components/lists/list-form';
import AppLayout from '@/layouts/app-layout';
import { type ListType } from '@/types';
import { Head } from '@inertiajs/react';

export default function CreateList({ type }: { type: ListType }) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My lists', href: '/dashboard' },
                { title: 'New list', href: '/lists/create' },
            ]}
        >
            <Head title="Create a list" />
            <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-medium tracking-tight">Create a list</h1>
                    <p className="text-muted-foreground mt-1">You can change any of this later.</p>
                </div>
                <ListForm
                    action={{ method: 'post', url: route('lists.store') }}
                    submitLabel="Create list"
                    initial={{
                        type,
                        title: '',
                        description: '',
                        event_date: '',
                        theme: type === 'registry' ? 'blush' : 'dusk',
                        privacy: 'unlisted',
                        access_password: '',
                        notify_on_purchase: true,
                        shipping_enabled: false,
                        shipping_address: {},
                    }}
                />
            </div>
        </AppLayout>
    );
}
