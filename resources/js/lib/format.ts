export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) {
    if (!value) return null;
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

export function daysUntil(value: string | null | undefined) {
    if (!value) return null;
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    const target = new Date(y, m - 1, d).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today.getTime()) / 86_400_000);
}

export function countdownLabel(value: string | null | undefined) {
    const days = daysUntil(value);
    if (days === null) return null;
    if (days > 1) return `${days} days to go`;
    if (days === 1) return 'Tomorrow';
    if (days === 0) return 'Today';
    return 'Event has passed';
}

export function csrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export async function postJson<T>(url: string, body: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }

    return response.json() as Promise<T>;
}
