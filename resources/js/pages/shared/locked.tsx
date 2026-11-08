import { ListCover } from '@/components/lists/list-cover';
import { Field } from '@/components/lists/list-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicLayout from '@/layouts/public-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Lock } from 'lucide-react';

interface Props {
    list: { title: string; type: string; theme: string; owner_name: string | null; token: string };
}

export default function LockedList({ list }: Props) {
    const { data, setData, post, processing, errors } = useForm({ password: '' });

    return (
        <PublicLayout>
            <Head title="Password required">
                <meta name="robots" content="noindex" />
            </Head>
            <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
                <div className="bg-card overflow-hidden rounded-3xl border shadow-lg">
                    <ListCover themeKey={list.theme} className="flex h-32 items-center justify-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-white/80 text-black shadow">
                            <Lock className="size-6" />
                        </span>
                    </ListCover>
                    <form
                        className="space-y-5 p-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            post(route('lists.unlock', list.token));
                        }}
                    >
                        <div className="text-center">
                            <h1 className="font-display text-2xl font-medium">{list.title}</h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {list.owner_name ? `${list.owner_name} protected this list with a password.` : 'This list is password protected.'}{' '}
                                Enter it to continue.
                            </p>
                        </div>
                        <Field label="Password" htmlFor="password" error={errors.password}>
                            <Input
                                id="password"
                                type="password"
                                autoFocus
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </Field>
                        <Button type="submit" className="w-full" size="lg" disabled={processing}>
                            {processing && <LoaderCircle className="animate-spin" />} Open list
                        </Button>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
