---
date: 2026-10-21
tags: [policy, stpauls]
status: suggestions for the church
---

# Suggested policy wording

The new website no longer has logins, comments or visitor tracking, so some sentences on the Cookie Policy and Privacy Policy pages are no longer true. These are suggestions for the church to agree or change. They are not legal advice. Once agreed, Paul makes the changes in Pages CMS (**Pages**, **About**, then the policy page).

The migration copied every page exactly as it was, so the old sentences are still on the new site until someone changes them.

## Cookie Policy

### Sentences that no longer apply

| Current sentence | Why it no longer applies |
|---|---|
| **Authentication Cookies:** When you register an account or login, we use a cookie to identify you and allow you to use secure services. | Visitors can't register or log in any more. Editing happens in a separate editor, not on the website |
| **Functional Cookies**: We use a third party plugin called *Disqus* to manage our site's comment system. | Comments have gone, and Disqus with them |
| **Performance Cookies:** We use Google Analytics to anonymously monitor traffic behaviour across the site. (and the rest of that paragraph) | Google Analytics has been removed. Nothing tracks visitors now |
| It is important you know this site uses cookies and that by accessing the site, you consent to their use and agree to this policy. | The website itself sets no cookies. Only the embedded Google calendar does, on one page |

### Suggested replacement

Replace everything from the top of the page to the end of "Third Party Cookies" with:

> **Cookies on this website**
>
> This website doesn't set any cookies of its own, and it doesn't track visitors.
>
> **Church Diary page.** This page shows our Google calendar. When it loads, Google may set a cookie called `NID` on your device. Google uses it to remember your preferences. You can read about it in [Google's cookie policy](https://policies.google.com/technologies/cookies).
>
> **Church Gallery page.** This page shows photos from our Facebook page through a service called EmbedSocial. [Name any cookies here once the cookie check is done, or say it sets none.]
>
> No other page sets cookies.

The "Prevent Cookies" and "Manage Cookies" sections can stay. Their browser links are old (Internet Explorer and an old Opera page), so the church may want to trim the list to Chrome and Firefox.

Two things to fill in before this goes live:

- The gallery sentence waits for the maintainer's cookie check (spec 09).
- If the calendar is changed to load only when a visitor asks for it, add: "The calendar only loads, and Google only sets its cookie, when you choose to show it."

## Privacy Policy

### Sentence that is out of date

| Current sentence | Why |
|---|---|
| St Paul's Church is committed to meeting its obligations under the Data Protection Act of 1998 and GDPR. | The 1998 Act was replaced by the Data Protection Act 2018, alongside the UK GDPR |

Suggested: "St Paul's Church is committed to meeting its obligations under the Data Protection Act 2018 and the UK GDPR."

### New paragraph: the contact form

The contact page has a form that emails the church. The privacy policy should say what happens to what people type. Suggested:

> **The contact form**
>
> When you use the contact form, we receive your name, your email address, your phone number if you give it, the type of enquiry you choose and your message. A service called Web3Forms sends them to the church by email. We only use them to reply to you. [The church decides how long enquiries are kept, for example "We delete enquiries after a year."]

The church fills in how long it keeps enquiries.

## Not a policy, but flagged

The migration report also flagged this sentence on the **Church Groups** page, because it may no longer be true:

> With over 40 years' experience of playing for weddings, our organist is able to offer advice on suitable pieces for the entrance of the bride, hymns, music during the signing of the register and at the exit of the happy couple.

Paul can check it with the organist and update the page if needed.
