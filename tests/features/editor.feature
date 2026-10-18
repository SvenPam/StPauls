Feature: Pages CMS
  What Paul can edit, and what a save must never lose.

  Background:
    Given the Pages CMS config

  Scenario: Collections and where they save
    Then the "blog" collection saves to "site/content/blog"
    And the "events" collection saves to "site/content/calendar"
    And the "notices" collection saves to "site/content/notices"

  Scenario: A save keeps a migrated item's live URL
    Then saving keeps front matter the form does not show
    And the "blog" collection has a hidden "url" field
    And the "events" collection has a hidden "url" field
    And the "notices" collection has a hidden "url" field

  Scenario: Bodies are saved as HTML
    Then every rich text field saves HTML

  Scenario: Event times are saved in a form the site reads
    Then the "events" collection saves "date" as date and time "yyyy-MM-dd'T'HH:mm:ss"
    And the "events" collection saves "end" as date and time "yyyy-MM-dd'T'HH:mm:ss"

  Scenario: Topics match the site's topics
    Then the "blog" collection offers the site topics as "blogtopics"
    And the "events" collection offers the site topics as "eventtopics"
    And the "notices" collection offers the site topics as "noticetopics"

  Scenario: A title of "Index" cannot replace a section page
    Then a title of "Index" is refused
    And a title of "index" is refused
    And a title of "Index of hymns" is allowed

  Scenario: Whatever Paul has saved builds
    Then the real content builds
