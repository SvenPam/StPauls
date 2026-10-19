---
date: 2026-10-19
tags: [report, stpauls, migration]
status: draft
---

# Migration report

_Written by `scripts/migrate.mjs` from http://stpaulswarton.co.uk, with dates and locations from the SQL export. Run again on cutover day. See [spec 07](page-cms-spec-07-content-migration.md) and [spec 07a](page-cms-spec-07a-content-match.md)._

## Counts

| Type | Items |
|---|---|
| Articles | 7 |
| Events | 69 |
| Notices | 5 |
| Pages | 14 |

## Inferred dates

_None._

## Unknown topics

_None._

## Failed downloads

| File | From | Error |
|---|---|---|
| uploads/acny/IMG_20200816_104753.jpg | https://media.acny.uk/media/venues/page/attachment/2020/08/IMG_20200816_104753.jpg | HTTP 403 |
| uploads/acny/D_Slater_Gravestone.jpg | https://media.acny.uk/media/venues/page/attachment/2020/08/D_Slater_Gravestone.jpg | HTTP 403 |
| uploads/acny/E_Snape_Gravestone.jpg | https://media.acny.uk/media/venues/page/attachment/2020/08/E_Snape_Gravestone.jpg | HTTP 403 |
| uploads/acny/J_Cross_Gravestone.jpg | https://media.acny.uk/media/venues/page/attachment/2020/08/J_Cross_Gravestone.jpg | HTTP 403 |
| uploads/acny/xff2.gif.pagespeed.ic.OQI2ICk4z7.png | http://www.achurchnearyou.com/images/xff2.gif.pagespeed.ic.OQI2ICk4z7.png | HTTP 404 |
| uploads/acny/xcoffee.gif.pagespeed.ic.jakvOejvvY.png | http://www.achurchnearyou.com/images/xcoffee.gif.pagespeed.ic.jakvOejvvY.png | HTTP 404 |

## Iframes kept

_None._

## Removed scripts

| Item | What |
|---|---|
| /calendar/event/30/songs-of-praise | onclick on <a> |
| /page/groups/church-groups | image from chrome-extension |
| /page/groups/church-groups | image from chrome-extension |

## Files the script did not write

_None._

## Policy text that no longer applies

| Page | Sentence |
|---|---|
| /page/about/cookie-policy | We use: Authentication Cookies: When you register an account or login, we use a cookie to identify you and allow you to use secure services. |
| /page/about/cookie-policy | We use: Functional Cookies : We use a third party plugin called Disqus to manage our site's comment system. |
| /page/about/cookie-policy | Performance Cookies: We use Google Analytics to anonymously monitor traffic behaviour across the site. |
| /page/groups/church-groups | With over 40 years’ experience of playing for weddings, our organist is able to offer advice on suitable pieces for the entrance of the bride, hymns, music during the signing of the register and at the exit of the happy couple. |

## Bodies left as HTML

_None._
