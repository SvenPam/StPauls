Feature: Notice dates
  A notice shows from its Show from day and goes after its Show until day, as on live.
  The clock site is built at 2030-06-15 12:00 UK time.

  Scenario: The home page shows the 5 newest notices that have started and not ended
    When I open "/" on the clock site
    Then the home notices are exactly:
      | No until 5 |
      | No until 4 |
      | No until 3 |
      | No until 2 |
      | No until 1 |

  Scenario: The notices page shows every notice that has not ended
    When I open "/notices" on the clock site
    Then I see "Not started"
    And I see "Until today"
    And I see "Current"
    And I do not see "Ended"

  Scenario: An ended notice keeps its page, marked expired
    When I open "/notices/notice/ended" on the clock site
    Then the page heading is "Ended"
    And I see "Expired"
    And I see "This notice has now expired and should be ignored."

  Scenario: A current notice has no expired box
    When I open "/notices/notice/current" on the clock site
    Then I do not see "This notice has now expired"

  Scenario: Notices show no date
    When I open "/notices/notice/current" on the clock site
    Then I do not see "01-Jun-30"
    When I open "/notices" on the clock site
    Then I do not see "01-Jun-30"

  Scenario: An ended notice leaves the site maps and the feed
    When I read the site map "/sitemap.xml" on the clock site
    Then it does not list:
      | https://stpaulswarton.co.uk/notices/notice/ended |
    When I open "/sitemap" on the clock site
    Then I do not see "Ended"
    When I read the feed "/notices/index.xml" on the clock site
    Then no item is titled "Ended"

  Scenario: Topic pages keep ended notices
    When I open "/notices/topic/church-events" on the clock site
    Then I see "Ended"
