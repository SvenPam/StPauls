---
date: 2026-10-18
tags: [how-to, stpauls]
---

# How to set up the contact form

The contact page shows a form once a Web3Forms key is saved in Site settings. Until then it shows the address and the church contact list. Every enquiry goes to one inbox. Built in [spec 08](page-cms-spec-08-contact-form-and-settings.md).

## Who does this

Whoever will receive the enquiries, with the maintainer. The key is tied to their email address, so they create it themselves. No password or account sharing is needed.

## Create the key

1. Go to [web3forms.com](https://web3forms.com) and enter the email address that should receive enquiries.
2. Web3Forms emails the access key to that address. It looks like `0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a`.
3. Send the key to the person who edits the site (Paul). The key is not a secret: it appears in the page for anyone to see, and it can only send email to the address it was made for.

## Paste it into Site settings

1. In Pages CMS, open **Site settings**.
2. Paste the key into **Contact form key**. Paste only the key: no spaces, no line break, not the whole snippet Web3Forms shows. Pages CMS refuses anything else.
3. Save. The site rebuilds and the form appears on `/contact` a few minutes later.

To hide the form again, empty **Contact form key** and save.

## Send a test message

1. Open `https://stpaulswarton.co.uk/contact` and send a message with your own email address.
2. You should land on the "Thank you" page, and the inbox should get an email titled "Website enquiry: <enquiry type>".
3. Reply to it: the reply goes to the address typed in the form.

The thanks page only works from the real domain. A test from the `azurestaticapps.net` test address still sends the email, but Web3Forms may not redirect back.

## What the free plan allows

About 250 messages a month, which is far more than the church gets. Web3Forms emails a warning if the limit gets close.

## If spam arrives

The form has a hidden spam trap that catches simple bots. If spam still gets through:

1. In the Web3Forms dashboard, turn on hCaptcha for the form.
2. Ask the maintainer to add the hCaptcha script to the contact page and its addresses to the Content Security Policy (spec 09). hCaptcha is off to start with because it loads a third-party script on the page.

## Change the inbox

1. The new receiving person creates a key at web3forms.com with their address, as above.
2. Paste the new key into **Contact form key** and save.

That is all. The old key stops being used as soon as the site rebuilds.

## Change the other settings

In Site settings Paul can also change the email subject, the enquiry types, the address lines and the Facebook, map and directions links. The footer and the contact page update after the next build. If every enquiry type is removed, the form offers "General Enquiry".
