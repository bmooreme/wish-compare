export type ThemeKey = 'blush' | 'sage' | 'dusk' | 'ocean' | 'sand' | 'plum';

export const themes: Record<ThemeKey, { label: string; gradient: string; ink: string }> = {
    blush: { label: 'Blush', gradient: 'linear-gradient(135deg, #fbd5cf 0%, #f6a99b 45%, #e9877c 100%)', ink: '#5a1f1a' },
    sage: { label: 'Sage', gradient: 'linear-gradient(135deg, #e3eddc 0%, #b9d0ad 50%, #8fb48a 100%)', ink: '#1f3a22' },
    dusk: { label: 'Dusk', gradient: 'linear-gradient(135deg, #cfc4f5 0%, #9b88e6 50%, #5b45b8 100%)', ink: '#ffffff' },
    ocean: { label: 'Ocean', gradient: 'linear-gradient(135deg, #cdebf2 0%, #7cc3d8 50%, #2f7ea1 100%)', ink: '#0b2a38' },
    sand: { label: 'Sand', gradient: 'linear-gradient(135deg, #f8ecd8 0%, #ead2a8 50%, #d4ad72 100%)', ink: '#3d2a0e' },
    plum: { label: 'Plum', gradient: 'linear-gradient(135deg, #5a2d6e 0%, #3a1c52 55%, #1f1035 100%)', ink: '#ffffff' },
};

export function theme(key: string | null | undefined) {
    return themes[(key as ThemeKey) ?? 'blush'] ?? themes.blush;
}
