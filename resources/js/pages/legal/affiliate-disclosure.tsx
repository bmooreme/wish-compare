import LegalPage from '@/components/legal-page';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AffiliateDisclosure() {
    const { name } = usePage<SharedData>().props;

    return (
        <LegalPage title="Affiliate disclosure" updated="November 8, 2026">
            <p>
                {name} is free to use. To keep it that way, some links to stores on {name} are <strong>affiliate links</strong>. When you buy
                something after clicking one of these links, the store may pay us a small commission.
            </p>
            <ul>
                <li>You pay exactly the same price you would otherwise pay.</li>
                <li>Commissions never affect which stores we show or how items are listed. List owners choose their own items.</li>
                <li>We don’t show prices; the store’s checkout is always the final word on price, availability and shipping.</li>
            </ul>
            <h2>Amazon Associates</h2>
            <p>As an Amazon Associate, {name} earns from qualifying purchases.</p>
            <h2>Other programs</h2>
            <p>
                We may also participate in affiliate programs run by Walmart, Target, Best Buy, Barnes &amp; Noble and other retailers, directly or
                through networks such as Impact, CJ, Rakuten, Awin, Sovrn or Skimlinks.
            </p>
        </LegalPage>
    );
}
