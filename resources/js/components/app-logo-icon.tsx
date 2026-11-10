import { SVGAttributes } from 'react';

/** TappyList mark: a wish-star with a small companion spark. Name-agnostic so the brand can change. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
            <path d="M14 3.5c.6 4.9 2.1 7.9 4.6 9.4 1.6 1 3.6 1.5 6.4 1.8-2.8.3-4.8.8-6.4 1.8-2.5 1.5-4 4.5-4.6 9.4-.6-4.9-2.1-7.9-4.6-9.4-1.6-1-3.6-1.5-6.4-1.8 2.8-.3 4.8-.8 6.4-1.8 2.5-1.5 4-4.5 4.6-9.4Z" />
            <path
                d="M25 20.5c.3 2 .9 3.2 1.9 3.9.7.4 1.5.6 2.6.7-1.1.1-1.9.3-2.6.7-1 .7-1.6 1.9-1.9 3.9-.3-2-.9-3.2-1.9-3.9-.7-.4-1.5-.6-2.6-.7 1.1-.1 1.9-.3 2.6-.7 1-.7 1.6-1.9 1.9-3.9Z"
                opacity=".55"
            />
        </svg>
    );
}
