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
