import { Button, type ButtonProps } from '@/components/ui/button';
import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

export function CopyLinkButton({ url, label = 'Copy link', ...props }: { url: string; label?: string } & ButtonProps) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy this link:', url);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button type="button" variant="outline" onClick={copy} {...props}>
            {copied ? <Check className="text-success" /> : <Copy />}
            {copied ? 'Copied!' : label}
        </Button>
    );
}

export function ShareButton({ url, title, ...props }: { url: string; title: string } & ButtonProps) {
    const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

    if (!canShare) {
        return <CopyLinkButton url={url} label="Share" {...props} />;
    }

    return (
        <Button type="button" onClick={() => navigator.share({ title, url }).catch(() => undefined)} {...props}>
            <Share2 /> Share
        </Button>
    );
}
