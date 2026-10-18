Feature: Notices

  Scenario: Newest first, with live URLs
    When I open "/notices"
    Then the page heading is "Notices"
    And the cards are, in order:
      | Fixture future   |
      | Fixture newer    |
      | Fixture older    |
      | Fixture migrated |
      | Fixture wide content with a very long title that has to wrap on a phone screen without pushing the page sideways |
      | Fixture dated    |
      | Fixture syntax   |
    And the "Fixture newer" link goes to "/notices/notice/newer"
    And the "Fixture newer" card shows "01-Feb-26"
    And the "Fixture newer" card shows "Newer summary"

  Scenario: A future-dated notice is published
    Then "/notices/notice/future" exists

  Scenario: A migrated notice keeps its live URL
    Then "/notices/notice/46/news-pew-sheets" exists
    When I open "/notices"
    And the "Fixture migrated" link goes to "/notices/notice/46/news-pew-sheets"

  Scenario: A Pages CMS file name keeps its date in the URL
    Then "/notices/notice/2026-01-05-dated" exists
    And "/notices/notice/dated" does not exist

  Scenario: Template syntax in a body is shown as written
    When I open "/notices/notice/syntax"
    Then I see "Braces {{ site.title }} and {% include \"base.njk\" %} stay"

  Scenario: A notice page
    When I open "/notices/notice/newer"
    Then the page heading is "Fixture newer"
    And I see "01-Feb-26"
    And I see "Church Hall"
    And the "Church Events" link goes to "/notices/topic/church-events"
    And the body has a list item "Item one"
    And the "a link" link goes to "https://example.org/"
    And I see "*stars*"
    And the body shows "Indented after blank" as text, not code

  Scenario: A missing or unknown topic shows no topic link
    When I open "/notices/notice/older"
    Then the page has no topic link
    When I open "/notices"
    Then the "Fixture future" card has no topic

  Scenario: Topic pages
    When I open "/notices/topic/church-events"
    Then the page heading is "Notices"
    And I see "Topic: Church Events"
    And the cards are, in order:
      | Fixture newer |
    When I open "/notices/topic"
    Then the page heading is "Topics"
    And the "Website" link goes to "/notices/topic/website"

  Scenario: No notices
    When I open "/notices" on the empty site
    Then I see "Could not find any notices."

  Scenario: A stray content file publishes no page and does not fail the build
    Then "/stray" does not exist
    And "/notices/sub/x" does not exist
    And "/notices/notice/x" does not exist
