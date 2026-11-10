# TappyWish

Wish lists and gift registries that work with every store. List owners add products from any
shop; guests (no account needed) buy wherever they like through affiliate-tagged links, then
mark the gift purchased with their order number.

> The app name comes from `APP_NAME` in `.env`. The UI, emails, page titles and the installable
> app's name all follow it.

## Features

- **Accounts:** register, email verification, password reset, profile and password settings.
- **Wish lists and registries:** registries add quantities ("8 plates, 3 bought"), an event date
  countdown and an optional shipping address.
- **Privacy:** public (searchable at `/find`), link-only, or password protected. Share links can
  be regenerated.
- **Adding items:** paste a product link and the name, photo and UPC/ISBN are read from the
  page's Open Graph / schema.org data. Manual entry is always available. Flag any number of items
  as **Most wanted**, add notes, and drag to reorder.
- **Import from Amazon:** the user copies their Amazon list page in their own browser
  (select all, copy) and pastes it into TappyWish. The app finds each product with its name,
  image, requested quantity, "Highest" priority (becomes Most wanted) and comment. The user
  reviews and edits the items, then imports them into a new or existing list, and items already
  on that list are skipped. On phones, users can paste Amazon product links instead. TappyWish never
  fetches Amazon pages itself: Amazon's terms forbid scraping, and doing it could get the
  affiliate account closed.
- **Product photos:** Amazon-hosted photos are never stored or shown, because Amazon only allows
  its product images through its own affiliate API. Items without a photo show a gift-box
  placeholder. Once a Best Buy or Walmart API key is configured, owners get a **Choose a photo**
  picker. It searches those retailers' catalogs by UPC or a cleaned-up product name (e.g.
  "KitchenAid Artisan KSM150PS 5-Quart Stand Mixer (Red), Pack of 1" becomes
  "KitchenAid Artisan KSM150PS 5-Quart Stand Mixer"), and the owner chooses the matching photo.
  Nothing is attached automatically.
- **Shopping:** every item gets a "Buy at…" button for the original store plus Amazon, Walmart,
  Target and Best Buy (and Barnes & Noble for books). All links pass through `/go/{item}/{store}`,
  which adds affiliate tags and counts clicks.
- **Marking purchases:** guests enter their name, the email used for the order, the store and the
  order number. They get a confirmation email with a private **Modify purchase** link to edit or
  undo it. Spam is blocked by a honeypot field, rate limits and optional Cloudflare Turnstile.
- **Surprise protection:** each item has a "show status" switch, hidden by default. Owners see
  purchase status, buyer names and order numbers only for items they've switched on. Owner
  emails leave out the details for hidden items. Guests always see what's been bought, so nobody
  buys the same gift twice.
- **Shipping address:** stored encrypted. It never appears in the page; a guest must click
  "Show shipping address", and the owner can turn this on or off.
- **Installable app (PWA):** web manifest, app icons, a service worker and an offline page.

## Tech stack

Laravel 12 (PHP 8.2+), Inertia.js + React 19 + TypeScript, Tailwind CSS 4, MariaDB/MySQL in
production (SQLite for local development and tests). No Node.js is needed on the server. The
front end is compiled to static files in `public/build`.

## Local development

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed   # demo user: demo@tappywish.test / password
composer dev                  # or: php artisan serve + npm run dev
```

Run the tests with `php artisan test`.

## Deploying to shared hosting (cPanel / CloudLinux)

The server needs PHP 8.2+, MariaDB, SSH access and cron. Node is **not** needed there.

1. **Build the front end** on your computer or in CI: `npm ci && npm run build`. This creates
   `public/build/`.
2. **Upload the project** (including `public/build/`) to a folder *outside* `public_html`,
   e.g. `~/tappywish`.
3. **Install Composer** in your home directory (one time only):
   ```bash
   mkdir -p ~/bin && cd ~/bin
   php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
   php composer-setup.php --filename=composer && rm composer-setup.php
   ```
4. **Install PHP dependencies:** `cd ~/tappywish && ~/bin/composer install --no-dev --optimize-autoloader`
5. **Configure:** `cp .env.example .env`, then set `APP_ENV=production`, `APP_DEBUG=false`,
   `APP_URL`, the `DB_*` values (`DB_CONNECTION=mariadb`) and the `MAIL_*` SMTP settings from
   your host. Then run `php artisan key:generate`.
   **Back up `APP_KEY`.** Order numbers and shipping addresses are encrypted with it, and they
   can't be recovered without it.
6. **Point the domain** (or subdomain) document root at `~/tappywish/public` in cPanel. If the
   domain must use `public_html`, replace that folder with a symlink:
   `ln -s ~/tappywish/public ~/public_html`
7. **Migrate and cache:**
   ```bash
   php artisan migrate --force
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   ```
8. **Cron** (cPanel → Cron Jobs). This one entry sends the queued emails every minute:
   ```
   * * * * * cd ~/tappywish && php artisan schedule:run >> /dev/null 2>&1
   ```

To update later: upload the new files, run `composer install --no-dev`, then
`php artisan migrate --force` and the cache commands again.

## Affiliate links

Set these in `.env` once each program approves you. Links work without them; they just aren't
tagged yet.

| Variable | Example |
| --- | --- |
| `AMAZON_ASSOCIATE_TAG` | `tappywish-20` |
| `WALMART_AFFILIATE_TEMPLATE` | Impact deep link, e.g. `https://goto.walmart.com/c/ID/ID/9383?u={url}` |
| `TARGET_AFFILIATE_TEMPLATE` | Impact deep link with `{url}` |
| `BESTBUY_AFFILIATE_TEMPLATE` | Impact deep link with `{url}` |
| `BARNESANDNOBLE_AFFILIATE_TEMPLATE` | CJ deep link, e.g. `https://www.anrdoezrs.net/click-PID-AID?url={url}` |
| `<STORE>_AFFILIATE_TEMPLATE` | Any store in `config/stores.php`, e.g. `ETSY_AFFILIATE_TEMPLATE` |
| `AFFILIATE_FALLBACK_TEMPLATE` | Sovrn Commerce / Skimlinks wrapper for every other store |

`{url}` is replaced with the URL-encoded destination.

### Photo search keys

| Variable | Where to get it |
| --- | --- |
| `BESTBUY_API_KEY` | Free developer key from developer.bestbuy.com |
| `WALMART_CONSUMER_ID`, `WALMART_KEY_VERSION`, `WALMART_PRIVATE_KEY_PATH`, `WALMART_PUBLISHER_ID` | walmart.io, after Walmart affiliate approval. Generate an RSA key pair, upload the public key there, and keep the private key file outside `public/`. |

Either one switches on the "Choose a photo" picker. Review each program's rules on displaying
its images, such as linking the image back to the store. To add or remove stores, edit
`config/stores.php`.

## Launch checklist

- [ ] Choose the final name and domain; update `APP_NAME` and `MAIL_FROM_ADDRESS`.
- [ ] Have the privacy policy and terms (`resources/js/pages/legal/`) reviewed by a qualified professional.
- [ ] Apply to the affiliate programs once the site is live, then fill in `.env`.
- [ ] Optional: add Cloudflare Turnstile keys for extra spam protection.
- [ ] Add a Best Buy and/or Walmart API key to switch on photo search.
- [ ] Set up SMTP and send a test purchase to confirm both emails arrive.
