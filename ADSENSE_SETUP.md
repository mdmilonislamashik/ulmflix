# ULMFlix — AdSense & Income Setup

This build is prepared for monetization, but Google AdSense cannot be activated automatically because the publisher ID belongs to your AdSense account.

## 1. Before applying
- Publish the site on your own domain.
- Replace `admin@example.com` in `contact.html` and `dmca.html` with your real email.
- Add original movie reviews, guides and other useful editorial content.
- Do not host or distribute copyrighted movies/TV episodes without the required rights.
- Keep About, Contact, Privacy, Terms and Copyright/DMCA pages live.

Google says AdSense sites should have original, high-quality content and comply with its publisher policies.

## 2. Add your AdSense ID
Open `js/config.js` and change:

`ADSENSE_PUBLISHER_ID: ""`

to your real client ID, for example:

`ADSENSE_PUBLISHER_ID: "ca-pub-1234567890123456"`

Then change:

`ADSENSE_ENABLED: false`

to:

`ADSENSE_ENABLED: true`

## 3. Update ads.txt
After you get the publisher ID, replace `PUB_ID_HERE` guidance in `ads.txt` with the exact line provided by AdSense. Do not invent the ID.

## 4. Revenue options already prepared
- Google AdSense display ads
- Premium membership UI
- Affiliate/sponsorship/donation options in the existing monetization area
- A cleaner legal/privacy structure for an advertising-supported site

The website does not guarantee approval or income. AdSense approval and earnings depend on Google's review, policy compliance, traffic, advertiser demand and user engagement.
