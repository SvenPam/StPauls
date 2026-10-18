Feature: RSS feeds
  The feeds replace the old publish emails.

  Scenario: Blog feed
    When I read the feed "/blog/index.xml"
    Then it is valid RSS 2.0 with 8 items
    And every item has a link without a trailing slash and a date
    And the item "Fixture article 8" is described as "Article eight summary"
    And the item "Fixture article 2" is described by the start of its body, at most 300 characters

  Scenario: Notices feed text is escaped once
    When I read the feed "/notices/index.xml"
    Then it is valid RSS 2.0 with 7 items
    And the item "Fixture older" is described as "Older body at St Paul's for tea & cake"
    And the item "Fixture newer" is described as "Newer summary"

  Scenario: Calendar feed lists upcoming events only
    When I read the feed "/calendar/index.xml"
    Then it is valid RSS 2.0 with 3 items
    And the items are, in order:
      | Fixture future    |
      | Fixture later     |
      | Fixture backwards |

  Scenario: No events, no items
    When I read the feed "/calendar/index.xml" on the empty site
    Then it is valid RSS 2.0 with 0 items

  Scenario: Only sections have feeds
    Then "/index.xml" does not exist
    And "/blog/article/a8/index.xml" does not exist
