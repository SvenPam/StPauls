Feature: Layout and delivery

  Scenario: Legacy content cannot push the page wider than a phone
    Given a phone screen
    When I open "/notices/notice/wide"
    Then the page does not scroll sideways

  Scenario: One small stylesheet and one small deferred script
    When I open "/notices"
    Then the stylesheet is under 25000 bytes and carries an integrity hash
    And the script is under 2048 bytes, deferred and carries an integrity hash
    And the page has no inline script, style or event handler

  Scenario: Internal links have no trailing slash
    When I open "/blog/article/a8"
    Then no link in the page ends with a slash

  Scenario: No personal details or trackers
    Then none of these pages mention the maintainer or a tracker:
      | /                                |
      | /notices                         |
      | /notices/notice/newer            |
      | /blog                            |
      | /blog/article/a8                 |
      | /calendar                        |
      | /calendar/event/future           |
      | /404.html                        |
