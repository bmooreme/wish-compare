import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string;
            remove: (id: string) => void;
        };
    }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    return new Promise((resolve) => {
        const script = existing ?? Object.assign(document.createElement('script'), { src: SCRIPT_SRC, async: true, defer: true });
        script.addEventListener('load', () => resolve());
        if (!existing) document.head.appendChild(script);
    });
}

/** Cloudflare Turnstile widget. Renders nothing unless a site key is configured. */
export function Turnstile({ siteKey, onToken }: { siteKey: string | null; onToken: (token: string) => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!siteKey || !ref.current) return;
        let id: string | undefined;
        let cancelled = false;
        loadScript().then(() => {
            if (cancelled || !ref.current || !window.turnstile) return;
            id = window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken('') });
        });
        return () => {
            cancelled = true;
            if (id && window.turnstile) window.turnstile.remove(id);
        };
    }, [siteKey, onToken]);

    return siteKey ? <div ref={ref} className="min-h-[65px]" /> : null;
}
