Feature: Site maps
  Search engines get every page once, on the real domain. People get a page of links.

  Scenario: The XML site map lists every page once, on the real domain
    When I read the site map "/sitemap.xml"
    Then it lists:
      | https://stpaulswarton.co.uk/                                             |
      | https://stpaulswarton.co.uk/page/about/about-us                          |
      | https://stpaulswarton.co.uk/contact                                      |
      | https://stpaulswarton.co.uk/calendar/event/16/mu-advent-carol-service    |
      | https://stpaulswarton.co.uk/blog/topic/website                           |
      | https://stpaulswarton.co.uk/notices/notice/2026-01-05-dated              |
    And it does not list:
      | https://stpaulswarton.co.uk/404.html   |
      | https://stpaulswarton.co.uk/sitemap    |
      | https://stpaulswarton.co.uk/page/about |
      | https://stpaulswarton.co.uk/blog/topic |
    And no address in it ends with a slash, except the home page
    And every address in it is listed once

  Scenario: robots.txt points at the site map
    Then "/robots.txt" says "Sitemap: https://stpaulswarton.co.uk/sitemap.xml"

  Scenario: The HTML site map
    When I open "/sitemap"
    Then the page heading is "Site Map"
    And the "Blog" link goes to "/blog"
    And the "Fixture article 8" link goes to "/blog/article/a8"
    And the "Calendar" link goes to "/calendar"
    And the "Notices" link goes to "/notices"
    And the "About Us" link goes to "/page/about/about-us"
    And the "Contact Us" link goes to "/contact"
    And I do not see "Fixture past"
