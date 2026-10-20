Feature: Sharing and search, as on live

  Scenario: Live's search descriptions
    When I open "/"
    Then the search description is "St. Pauls's Church, Warton. Serving Christ - Serving the Community."
    When I open "/blog"
    Then the search description is "Read the latest blog articles from St. Pauls Church, Warton."
    When I open "/calendar"
    Then the search description is "Read the latest events and going's on at St Pauls Church, Warton."
    When I open "/notices"
    Then the search description is "Latest bulletins and notices for St. Pauls Church, Warton."
    When I open "/calendar/topic/church-events"
    Then the search description is "Read the latest events and going's on at St Pauls Church, Warton."

  Scenario: An item's summary is its description
    When I open "/blog/article/a8"
    Then the search description is "Article eight summary"

  Scenario: The home page has a Facebook preview
    When I open "/"
    Then the page shares as "website" titled "St Paul's Warton"
    And the share description is "St. Pauls's Church, Warton. Serving Christ - Serving the Community."
    And the share address is "https://stpaulswarton.co.uk/"
    And the share picture is an absolute address on "https://stpaulswarton.co.uk/images/hero-"

  Scenario: An article has a Facebook preview
    When I open "/blog/article/a8"
    Then the page shares as "article" titled "Fixture article 8"
    And the share description is "Article eight summary"
    And the share address is "https://stpaulswarton.co.uk/blog/article/a8"
    And the share picture is an absolute address on "https://stpaulswarton.co.uk/images/fixture-wide-"

  Scenario: An article with no summary or picture still shares
    When I open "/blog/article/st-pauls-churchyard-in-bloom"
    Then the share description is "Read the latest blog articles from St. Pauls Church, Warton."
    And the share picture is an absolute address on "https://stpaulswarton.co.uk/images/generic-"

  Scenario: Other pages have no Facebook preview
    When I open "/page/about/about-us"
    Then the page has no share tags
