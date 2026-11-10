<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'turnstile' => [
        'site_key' => env('TURNSTILE_SITE_KEY'),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
    ],

    // Product photo search (retailer affiliate APIs)
    'bestbuy' => [
        'api_key' => env('BESTBUY_API_KEY'),
    ],

    'walmart' => [
        'consumer_id' => env('WALMART_CONSUMER_ID'),
        'key_version' => env('WALMART_KEY_VERSION', '1'),
        'private_key_path' => env('WALMART_PRIVATE_KEY_PATH'),
        'private_key' => env('WALMART_PRIVATE_KEY'),
        'publisher_id' => env('WALMART_PUBLISHER_ID'),
    ],

];
