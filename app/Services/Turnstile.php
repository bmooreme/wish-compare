<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

/** Optional Cloudflare Turnstile verification. Disabled until keys are configured. */
class Turnstile
{
    public function enabled(): bool
    {
        return filled(config('services.turnstile.secret_key')) && filled(config('services.turnstile.site_key'));
    }

    public function verify(?string $token, ?string $ip = null): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        if (! $token) {
            return false;
        }

        try {
            return (bool) Http::asForm()->timeout(6)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => config('services.turnstile.secret_key'),
                    'response' => $token,
                    'remoteip' => $ip,
                ])->json('success', false);
        } catch (Throwable) {
            return false;
        }
    }
}
