import LegalPage from '@/components/legal-page';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Terms() {
    const { name } = usePage<SharedData>().props;

    return (
        <LegalPage title="Terms of use" updated="November 8, 2026">
            <p className="bg-muted rounded-xl p-4 text-sm">Draft for review: have these terms checked by a qualified professional before launch.</p>
            <h2>Using {name}</h2>
            <p>
                {name} helps you create wish lists and registries and share them with others. You’re responsible for what you add to your lists and
                for keeping your account secure.
            </p>
            <h2>Purchases happen at stores</h2>
            <p>
                {name} doesn’t sell products. All purchases, payments, shipping, returns and customer service are handled by the store you buy from,
                under that store’s terms. Purchase status on a list is reported by gift givers and may not always be accurate.
            </p>
            <h2>Acceptable use</h2>
            <ul>
                <li>Don’t use {name} for anything illegal, misleading or harmful.</li>
                <li>Don’t try to access lists you haven’t been given a link or password for.</li>
                <li>Don’t submit false purchase information.</li>
            </ul>
            <h2>Affiliate links</h2>
            <p>
                Some store links earn us a commission. See our <a href="/affiliate-disclosure">affiliate disclosure</a>.
            </p>
            <h2>Changes</h2>
            <p>We may update these terms as the service grows. Continued use after changes means you accept the updated terms.</p>
        </LegalPage>
    );
}
