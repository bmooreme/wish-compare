import LegalPage from '@/components/legal-page';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Privacy() {
    const { name } = usePage<SharedData>().props;

    return (
        <LegalPage title="Privacy policy" updated="November 8, 2026">
            <p className="bg-muted rounded-xl p-4 text-sm">
                Draft for review: have this policy checked by a qualified professional before launch and update it to match your final setup.
            </p>
            <h2>What we collect</h2>
            <ul>
                <li>
                    <strong>List owners:</strong> name, email address, password (stored hashed), the lists and items you create and, for registries, a
                    shipping address if you choose to add one (stored encrypted).
                </li>
                <li>
                    <strong>Gift givers:</strong> when you mark an item purchased, we collect your name, the email address used for the order, the
                    store and the order number (stored encrypted). No account is required.
                </li>
                <li>
                    <strong>Usage:</strong> anonymous counts of which store links are clicked, plus standard server logs.
                </li>
            </ul>
            <h2>How we use it</h2>
            <ul>
                <li>To run your lists, send confirmations and purchase notifications, and let gift givers change or undo a purchase.</li>
                <li>
                    Order numbers are shared with the list owner only when the owner has chosen to see purchase status for that item, to help with
                    returns.
                </li>
                <li>A registry shipping address is shown only when the owner enables it and a visitor clicks to reveal it.</li>
            </ul>
            <h2>What we don’t do</h2>
            <p>
                We don’t sell personal information, and we don’t share your details with stores. Stores receive only the visit when you click a link.
            </p>
            <h2>Your choices</h2>
            <p>
                You can edit or delete your lists and your account at any time from settings. Gift givers can update or remove a purchase using the
                private link in their confirmation email. Contact us to request a copy or deletion of your data.
            </p>
            <h2>Cookies</h2>
            <p>
                {name} uses essential cookies to keep you signed in and protect forms. Stores you visit through our links may set their own cookies,
                including affiliate tracking cookies.
            </p>
        </LegalPage>
    );
}
