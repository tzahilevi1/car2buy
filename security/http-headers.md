# HTTP Security Headers (for a CDN / reverse proxy)

GitHub Pages **cannot set custom HTTP headers**, so the site enforces its
Content-Security-Policy and Referrer-Policy via `<meta>` tags (see any page
`<head>`), plus a JS frame-buster for clickjacking. If you move the site behind
**Cloudflare, Netlify, Vercel, or Nginx**, add the real headers below — they are
stronger than the meta equivalents (e.g. `X-Content-Type-Options`,
`Strict-Transport-Security`, and CSP `frame-ancestors` only work as real headers).

## Recommended response headers (all routes)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://tdxhqpauuqawcoivjnnm.supabase.co wss://tdxhqpauuqawcoivjnnm.supabase.co https://data.gov.il https://api.ipify.org; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

> Admin/auth routes (`/admin.html`, `/reset.html`, `/sign.html`) additionally need
> `script-src ... 'unsafe-eval' https://cdn.jsdelivr.net` for the Supabase-JS
> client and html2pdf — scope a looser CSP to those paths only.

## Netlify — `_headers` file (place at site root)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://tdxhqpauuqawcoivjnnm.supabase.co wss://tdxhqpauuqawcoivjnnm.supabase.co https://data.gov.il https://api.ipify.org; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
  Cross-Origin-Opener-Policy: same-origin
```

## Cloudflare
Add the same headers via **Rules → Transform Rules → HTTP Response Header
Modification**, or a Workers `fetch` handler that appends them. Enable
**Always Use HTTPS** and **HSTS** in SSL/TLS settings.

## Verify
`curl -sI https://your-domain/ | grep -iE 'content-security|strict-transport|x-content-type|x-frame|referrer|permissions-policy'`
or scan at <https://securityheaders.com> and <https://observatory.mozilla.org>.
