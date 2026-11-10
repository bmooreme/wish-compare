export type ListType = 'wishlist' | 'registry';
export type Privacy = 'public' | 'unlisted' | 'password';

export interface ListSummary {
    id: number;
    type: ListType;
    title: string;
    description: string | null;
    event_date: string | null;
    theme: string;
    privacy: Privacy;
    share_url: string;
    items_count: number;
    most_wanted_count: number | null;
    updated_at: string;
}

export interface ItemStatus {
    purchased: number;
    remaining: number;
    complete: boolean;
}

export interface BaseItem {
    id: number;
    title: string;
    url: string | null;
    store_key: string | null;
    store_name: string | null;
    image_url: string | null;
    identifier: string | null;
    notes: string | null;
    quantity: number;
    most_wanted: boolean;
    position: number;
}

export interface OwnerPurchase {
    id: number;
    buyer_name: string;
    buyer_email: string;
    order_number: string;
    store: string | null;
    quantity: number;
    purchased_at: string;
}

export interface OwnerItem extends BaseItem {
    show_status: boolean;
    status: ItemStatus | null;
    purchases: OwnerPurchase[];
}

export interface ShopOption {
    key: string;
    name: string;
    direct: boolean;
    href: string;
}

export interface GuestItem extends BaseItem {
    status: ItemStatus;
    shop: ShopOption[];
}

export interface StoreChoice {
    key: string;
    name: string;
}

export type ShippingAddress = {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
};
