<?php

namespace App\Http\Requests\Lists;

use App\Models\GiftList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var GiftList|null $list */
        $list = $this->route('list');
        $needsNewPassword = $this->input('privacy') === 'password' && ! $list?->access_password;

        return [
            'type' => ['required', Rule::in(GiftList::TYPES)],
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'event_date' => ['nullable', 'date'],
            'theme' => ['required', Rule::in(GiftList::THEMES)],
            'privacy' => ['required', Rule::in(GiftList::PRIVACY)],
            'access_password' => [$needsNewPassword ? 'required' : 'nullable', 'string', 'min:4', 'max:64'],
            'notify_on_purchase' => ['boolean'],
            'shipping_enabled' => ['boolean'],
            'shipping_address' => ['nullable', 'array'],
            'shipping_address.name' => ['nullable', 'string', 'max:120'],
            'shipping_address.line1' => ['nullable', 'required_if:shipping_enabled,true', 'string', 'max:160'],
            'shipping_address.line2' => ['nullable', 'string', 'max:160'],
            'shipping_address.city' => ['nullable', 'required_if:shipping_enabled,true', 'string', 'max:80'],
            'shipping_address.state' => ['nullable', 'required_if:shipping_enabled,true', 'string', 'max:40'],
            'shipping_address.postal_code' => ['nullable', 'required_if:shipping_enabled,true', 'string', 'max:12'],
        ];
    }

    public function messages(): array
    {
        return [
            'access_password.required' => 'Choose a password guests will use to open this list.',
            'shipping_address.*.required_if' => 'This field is required to share a shipping address.',
        ];
    }

    /** @return array<string, mixed> */
    public function listAttributes(): array
    {
        $data = $this->safe()->except(['access_password', 'shipping_address']);
        $data['notify_on_purchase'] = $this->boolean('notify_on_purchase');
        $data['shipping_enabled'] = $data['type'] === 'registry' && $this->boolean('shipping_enabled');

        if ($data['type'] === 'registry' && $this->filled('shipping_address.line1')) {
            $data['shipping_address'] = collect($this->input('shipping_address'))
                ->only(['name', 'line1', 'line2', 'city', 'state', 'postal_code'])
                ->map(fn ($v) => is_string($v) ? trim($v) : null)
                ->all();
        } elseif ($data['type'] !== 'registry') {
            $data['shipping_address'] = null;
        }

        if ($data['privacy'] !== 'password') {
            $data['access_password'] = null;
        } elseif ($this->filled('access_password')) {
            $data['access_password'] = $this->input('access_password');
        }

        return $data;
    }
}
