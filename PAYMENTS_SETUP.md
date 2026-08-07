# ULMFlix payment setup

The code keeps all merchant secrets server-side. Never put these values in `js/config.js` or browser code.

## Stripe

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` and `APP_URL` in Vercel. Configure a Stripe webhook to `/api/stripe-webhook` for subscription and invoice events.

## SSLCommerz

Set `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`. The checkout endpoint is `/api/create-sslcommerz-session`; configure `/api/sslcommerz-ipn` as the IPN listener in the merchant panel.

## bKash

Set `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_SANDBOX`. Checkout is initiated through `/api/bkash-create` and returns the bKash hosted checkout URL. The callback is `/api/bkash-callback`.

## Nagad

Nagad requires a merchant-specific RSA key pair, merchant ID and the exact gateway environment/contract enabled for the merchant account. The project reserves the server-side provider boundary for Nagad, but you must supply the merchant contract values before enabling live transactions. Do not copy a random third-party Nagad credential or private key into the frontend.

## Important

A payment success redirect is not proof of payment. Production access must be granted only after the provider webhook/IPN/validation endpoint confirms the transaction and amount.
