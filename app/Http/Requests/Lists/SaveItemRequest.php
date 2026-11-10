<?php

namespace App\Http\Requests\Lists;

use Illuminate\Foundation\Http\FormRequest;

class SaveItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $partial = $this->isMethod('patch');
        $required = $partial ? 'sometimes' : 'required';

        return [
            'title' => [$required, 'string', 'max:255'],
            'url' => ['nullable', 'url:http,https', 'max:2048'],
            'image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'identifier' => ['nullable', 'string', 'max:32', 'regex:/^[0-9Xx\- ]+$/'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'most_wanted' => ['sometimes', 'boolean'],
            'show_status' => ['sometimes', 'boolean'],
        ];
    }
}
