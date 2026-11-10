<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;
use Illuminate\Support\Str;

/**
 * Extracts items from an Amazon wish list that the user copied from their own
 * browser and pasted into TappyList. We never fetch Amazon pages ourselves:
 * Amazon's terms forbid automated scraping (which would also put the
 * Associates account at risk), and it blocks server requests anyway.
 *
 * Works with the rich HTML a browser puts on the clipboard when you select a
 * list page and copy it, and falls back to plain text containing product links.
 */
class AmazonListParser
{
    public const MAX_ITEMS = 250;

    private const ASIN = '(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?=[\/?#&"\']|$)';

    /** Link texts that are buttons or chrome, never product names. */
    private const NOISE = [
        'add to cart', 'add to list', 'buy it again', 'see all buying options', 'move', 'delete',
        'view your list', 'share', 'more', 'details', 'see more', 'out of stock', 'shop now',
        'subscribe & save', 'other sellers', 'compare', 'customer reviews',
    ];

    /**
     * @return list<array{asin: string, title: string, url: string, image_url: ?string, quantity: int, most_wanted: bool, notes: ?string}>
     */
    public function parse(?string $html, ?string $text = null): array
    {
        $items = [];

        if ($html !== null && trim($html) !== '') {
            $items = $this->fromHtml($html);
        }

        // Plain-text links fill in anything the HTML didn't contain.
        foreach ($this->fromText((string) $text) as $asin => $item) {
            $items[$asin] ??= $item;
        }

        return array_slice(array_values($items), 0, self::MAX_ITEMS);
    }

    /** @return array<string, array<string, mixed>> */
    private function fromHtml(string $html): array
    {
        $doc = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"?>'.$html, LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($doc);

        /** @var array<string, list<DOMElement>> $anchors grouped by ASIN, in page order */
        $anchors = [];
        foreach ($xpath->query('//a[@href]') as $a) {
            if ($asin = $this->asinFrom($a->getAttribute('href'))) {
                $anchors[$asin][] = $a;
            }
        }

        $items = [];
        foreach ($anchors as $asin => $links) {
            $container = $this->containerFor($links[0], $asin);
            $title = $this->bestTitle($links, $container);

            if ($title === null) {
                continue;
            }

            $containerText = Str::squish($container->textContent);

            $items[$asin] = [
                'asin' => $asin,
                'title' => $title,
                'url' => $this->canonicalUrl($asin),
                // Amazon photos can only be displayed via Amazon's affiliate API,
                // so imports start with a placeholder; owners can pick a photo later.
                'image_url' => null,
                'quantity' => $this->quantity($containerText),
                'most_wanted' => (bool) preg_match('/priority\s*:?\s*highest|\bmust have\b/i', $containerText),
                'notes' => $this->comment($xpath, $container),
            ];
        }

        return $items;
    }

    /** @return array<string, array<string, mixed>> */
    private function fromText(string $text): array
    {
        $items = [];

        preg_match_all('~https?://(?:www\.|smile\.)?amazon\.com/(?:([^\s/?#]+)/)?'.self::ASIN.'[^\s]*~i', $text, $matches, PREG_SET_ORDER);

        foreach ($matches as $m) {
            $asin = strtoupper($m[2]);
            $slug = $m[1] ?? '';
            $title = $slug && ! in_array(strtolower($slug), ['dp', 'gp'], true)
                ? Str::of(urldecode($slug))->replace('-', ' ')->squish()->toString()
                : "Amazon item {$asin}";

            $items[$asin] ??= [
                'asin' => $asin,
                'title' => Str::limit($title, 250, ''),
                'url' => $this->canonicalUrl($asin),
                'image_url' => null,
                'quantity' => 1,
                'most_wanted' => false,
                'notes' => null,
            ];
        }

        return $items;
    }

    private function asinFrom(string $href): ?string
    {
        $href = html_entity_decode($href);
        $host = parse_url($href, PHP_URL_HOST);

        // Relative links (as copied from amazon.com) or absolute amazon.com links only.
        if ($host !== null && ! preg_match('/(^|\.)amazon\.com$/i', $host)) {
            return null;
        }

        return preg_match('~'.self::ASIN.'~i', $href, $m) ? strtoupper($m[1]) : null;
    }

    /**
     * Walk up from a product link to the largest ancestor that still only
     * describes this one product: that's the item's card on the list page.
     */
    private function containerFor(DOMElement $anchor, string $asin): DOMNode
    {
        $node = $anchor;

        while (($parent = $node->parentNode) instanceof DOMElement && ! in_array($parent->nodeName, ['body', 'html'], true)) {
            foreach ($parent->getElementsByTagName('a') as $a) {
                $other = $this->asinFrom($a->getAttribute('href'));
                if ($other !== null && $other !== $asin) {
                    return $node;
                }
            }
            $node = $parent;
        }

        return $node;
    }

    /** @param list<DOMElement> $links */
    private function bestTitle(array $links, DOMNode $container): ?string
    {
        $candidates = [];

        foreach ($links as $a) {
            foreach ([$a->getAttribute('title'), $a->textContent] as $value) {
                $value = Str::squish(html_entity_decode($value, ENT_QUOTES | ENT_HTML5));
                if (mb_strlen($value) >= 3 && ! in_array(mb_strtolower($value), self::NOISE, true) && ! preg_match('/^\$?[\d.,]+$/', $value)) {
                    $candidates[] = $value;
                }
            }
        }

        if ($candidates === [] && $container instanceof DOMElement) {
            foreach ($container->getElementsByTagName('img') as $img) {
                if (mb_strlen($alt = Str::squish($img->getAttribute('alt'))) >= 3) {
                    $candidates[] = $alt;
                }
            }
        }

        if ($candidates === []) {
            return null;
        }

        usort($candidates, fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));

        return Str::limit($candidates[0], 250, '');
    }

    private function quantity(string $text): int
    {
        if (preg_match('/(?:requested|quantity|qty|needs?|wants?)\s*:?\s*(\d{1,2})\b/i', $text, $m)) {
            return max(1, min(99, (int) $m[1]));
        }

        return 1;
    }

    private function comment(DOMXPath $xpath, DOMNode $container): ?string
    {
        $node = $xpath->query('.//*[starts-with(@id, "itemComment_")]', $container)->item(0);
        $comment = $node ? Str::squish($node->textContent) : '';

        if ($comment === '' && preg_match('/comment\s*:\s*(.+?)(?:\s+(?:priority|quantity|requested|has)\b|$)/i', Str::squish($container->textContent), $m)) {
            $comment = $m[1];
        }

        return $comment !== '' ? Str::limit($comment, 1000, '') : null;
    }

    private function canonicalUrl(string $asin): string
    {
        return "https://www.amazon.com/dp/{$asin}";
    }
}
