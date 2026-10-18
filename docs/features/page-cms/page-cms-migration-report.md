---
date: 2026-10-18
tags: [report, stpauls, migration]
status: draft
---

# Migration report

_Written by `scripts/migrate.mjs` from http://stpaulswarton.co.uk. Run again on cutover day. See [spec 07](page-cms-spec-07-content-migration.md)._

## Counts

| Type | Items |
|---|---|
| Articles | 7 |
| Events | 69 |
| Notices | 5 |
| Pages | 14 |

## Inferred dates

| Item | Date | Why |
|---|---|---|
| /calendar/event/16/mu-advent-carol-service | 2015-12-01T19:30:00 | inferred: year 2015 from its text |
| /calendar/event/19/advent-service-of-light | 2015-12-06T18:00:00 | inferred: year 2015 from its text |
| /calendar/event/22/ash-wednesday | 2016-02-10T09:30:00 | inferred: year 2016 from its text |
| /calendar/event/14/mothers-union-coffee-cake-and-a-chat | 2019-02-18T10:00:00 | inferred: year from the events around it |
| /calendar/event/23/the-beatitudes | 2016-03-21T19:00:00 | inferred: year 2016 from its text |
| /calendar/event/25/holy-week-and-easter-at-st-pauls | 2016-03-27T06:00:00 | inferred: year from the events around it |
| /calendar/event/30/songs-of-praise | 2016-03-27T18:30:00 | inferred: year 2016 from its text |
| /calendar/event/32/licensing | 2016-04-12T19:30:00 | inferred: year from the events around it |
| /calendar/event/33/holy-trinity-spring-fair | 2016-04-16T14:00:00 | inferred: year from the events around it |
| /calendar/event/26/st-georges-day-meal-at-lorenzos | 2016-04-22T19:00:00 | inferred: year from the events around it |
| /calendar/event/34/parish-agm | 2016-04-24T11:00:00 | inferred: year from the events around it |
| /calendar/event/41/warton-queens-birthday-celebrations | 2020-06-11T20:00:00 | inferred: year from the events around it |
| /calendar/event/40/celebration-of-the-queens-90th-birthday | 2019-06-12T15:00:00 | inferred: year from the events around it |
| /calendar/event/46/freckleton-club-day-coffee-morning | 2020-06-18T08:30:00 | inferred: year from the events around it |
| /calendar/event/48/evensong-at-blackburn-cathedral | 2016-07-24T16:00:00 | inferred: year 2016 from its text |
| /calendar/event/47/brass-band-concert | 2016-07-29T19:30:00 | inferred: year 2016 from its text |
| /calendar/event/50/wholeness-and-healing-service | 2016-07-31T18:00:00 | inferred: year from the events around it |
| /calendar/event/51/crossroads-mission-team-discussion | 2016-09-10T12:00:00 | inferred: year from the events around it |
| /calendar/event/1056/coffee-morning | 2019-09-17T10:00:00 | inferred: year from the events around it |
| /calendar/event/1057/coffee-morning | 2019-09-28T10:00:00 | inferred: year from the events around it |
| /calendar/event/54/pcc-meeting | 2017-10-03T19:00:00 | inferred: year from the events around it |
| /calendar/event/1058/mothers-union-wave-of-prayer | 2019-10-19T10:05:00 | inferred: year from the events around it |
| /calendar/event/1059/mothers-union-coffee-cake-and-a-chat | 2019-10-21T10:00:00 | inferred: year from the events around it |
| /calendar/event/1061/mothers-union-meeting-for-november | 2016-11-22T19:30:00 | inferred: year 2016 from its text |
| /calendar/event/1063/womens-institute-drop-in-lunch | 2017-11-24T11:30:00 | inferred: year from the events around it |
| /calendar/event/1060/2016-st-pauls-christmas-market | 2016-11-26T13:00:00 | inferred: year 2016 from its text |
| /calendar/event/1069/pcc-meeting | 2018-12-05T19:00:00 | inferred: year from the events around it |
| /calendar/event/1064/a-short-course-for-advent-1 | 2017-12-06T19:00:00 | inferred: year from the events around it |
| /calendar/event/1065/a-short-course-for-advent-2 | 2017-12-07T19:00:00 | inferred: year from the events around it |
| /calendar/event/1066/a-short-course-for-advent-3 | 2017-12-08T19:00:00 | inferred: year from the events around it |
| /calendar/event/1067/freckleton-brass-band-christmas-concert | 2017-12-11T15:00:00 | inferred: year from the events around it |
| /calendar/event/1070/coffee-cake-and-chat-for-december | 2018-12-12T10:00:00 | inferred: year from the events around it |
| /calendar/event/1068/lancashire-sings-christmas | 2017-12-15T19:00:00 | inferred: year from the events around it |
| /calendar/event/1071/mothers-union-coffee-cake-and-a-chat | 2017-01-19T10:00:00 | inferred: year 2017 from its text |
| /calendar/event/1073/patronal-festival | 2018-01-22T12:30:00 | inferred: year from the events around it |
| /calendar/event/1072/mothers-union-annual-general-meeting | 2017-01-24T19:00:00 | inferred: year 2017 from its text |
| /calendar/event/1074/pint-night-for-january | 2018-01-26T19:30:00 | inferred: year from the events around it |
| /calendar/event/1075/holy-trinity-spring-fair | 2018-03-18T14:00:00 | inferred: year from the events around it |
| /calendar/event/2075/mu-meeting | 2019-03-28T19:30:00 | inferred: year from the events around it |
| /calendar/event/2076/pint-night-for-march | 2017-03-30T19:30:00 | inferred: year 2017 from its text |
| /calendar/event/2077/commissioning-service-for-prayer-visitors | 2017-04-02T18:00:00 | inferred: year from the events around it |
| /calendar/event/1076/pesach-a-christian-passover | 2018-04-04T19:00:00 | inferred: year from the events around it |
| /calendar/event/2079/coffee-and-toasties | 2018-04-08T10:00:00 | inferred: year from the events around it |
| /calendar/event/1077/st-georges-day-meal | 2018-04-21T19:00:00 | inferred: year from the events around it |
| /calendar/event/2078/warton-village-quiz-2017 | 2017-04-22T19:30:00 | inferred: year 2017 from its text |
| /calendar/event/3079/mothers-union-meeting-for-june | 2018-06-27T19:30:00 | inferred: year from the events around it |
| /calendar/event/3080/pint-night-for-june | 2018-06-29T19:30:00 | inferred: year from the events around it |
| /calendar/event/3081/fionas-first-eucharist | 2018-07-02T09:45:00 | inferred: year from the events around it |
| /calendar/event/3082/praise-on-the-prom | 2018-07-16T14:00:00 | inferred: year from the events around it |
| /calendar/event/8/mu-meeting | 2018-11-27T19:00:00 | inferred: year from the events around it |
| /calendar/event/3083/ecumenical-advent-service | 2018-12-02T18:00:00 | inferred: year from the events around it |
| /calendar/event/35/pcc-meeting | 2018-12-03T19:21:00 | inferred: year 2018 from its text |
| /calendar/event/3084/parish-christmas-lunch | 2018-12-23T12:00:00 | inferred: year from the events around it |
| /calendar/event/3085/ecumenical-healing-service | 2018-12-30T18:00:00 | inferred: year from the events around it |
| /calendar/event/3086/service-of-prayer-for-christian-unity | 2019-01-20T18:00:00 | inferred: year from the events around it |
| /calendar/event/1055/coffee-cake-and-chat-for-january | 2019-01-24T10:00:00 | inferred: year 2019 from its text |
| /calendar/event/21/patronal-festival-lunch | 2019-01-27T12:00:00 | inferred: year 2019 from its text |
| /calendar/event/55/eucharist-for-wholeness-and-healing | 2018-02-13T19:00:00 | inferred: year from the events around it |
| /calendar/event/3088/confirmation-service | 2020-02-24T18:00:00 | inferred: year from the events around it |
| /calendar/event/3087/gemma-louise-doyle-in-concert | 2019-03-01T19:30:00 | inferred: year from the events around it |
| /calendar/event/53/mothers-union-meeting-for-march | 2017-03-26T19:30:00 | inferred: year from the events around it |
| /calendar/event/15/pint-night-for-march | 2019-03-28T19:30:00 | inferred: year 2019 from its text |
| /calendar/event/28/mothering-sunday | 2019-03-31T09:45:00 | inferred: year 2019 from its text |
| /calendar/event/38/dementia-friendly-service | 2019-04-01T14:30:00 | inferred: year from the events around it |
| /calendar/event/27/pesach-a-christian-passover | 2019-04-08T19:30:00 | inferred: year 2019 from its text |
| /calendar/event/29/quiz-night | 2019-04-27T19:30:00 | inferred: year 2019 from its text |
| /calendar/event/1062/christmas-services | 2017-10-22T11:00:00 | inferred: year from the events around it |
| /calendar/event/9/christmas-market-cancelled | 2018-11-28T13:00:00 | inferred: year from the events around it |
| /calendar/event/20/service-of-9-lessons-and-carols | 2015-12-13T18:00:00 | inferred: year from the events around it |
| /notices/notice/46/news-pew-sheets | 2026-10-01 | inferred: counted back from 2026-10-01 by id |
| /notices/notice/44/safeguarding | 2026-09-29 | inferred: counted back from 2026-10-01 by id |
| /notices/notice/43/latest-parish-magazine | 2026-09-28 | inferred: counted back from 2026-10-01 by id |
| /notices/notice/39/thank-you-for-your-donations | 2026-09-24 | inferred: counted back from 2026-10-01 by id |
| /notices/notice/38/online-donations-now-available | 2026-09-23 | inferred: counted back from 2026-10-01 by id |

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
