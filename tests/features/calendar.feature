Feature: Calendar
  Past events drop off at build time, nightly, and in the browser between builds.

  Scenario: Upcoming events, soonest first
    When I open "/calendar"
    Then the page heading is "Upcoming Events"
    And the cards are, in order:
      | Fixture future    |
      | Fixture later     |
      | Fixture backwards |
    And the "Fixture future" card shows "Future"
    And the "Fixture future" card shows "01-Jun-99 10:00 AM"
    And the "Fixture future" card shows "Church Hall"
    And I do not see "Fixture past"
    And I do not see "Could not find any events."

  Scenario: A past event still has its page, marked Expired
    When I open "/calendar/event/16/mu-advent-carol-service"
    Then the page heading is "Fixture past"
    And I see "Expired"
    And I see "7:30 PM"

  Scenario: An event page
    When I open "/calendar/event/future"
    Then the page heading is "Fixture future"
    And I see "10:00 AM"
    And I see "12:00 PM"
    And I see "June"
    And I see "Church Hall"
    And the summary "Future summary" is the lead
    And the "Church Events" link goes to "/calendar/topic/church-events"

  Scenario: An end before the start is treated as the start
    When I open "/calendar/event/backwards"
    Then I see "August"
    And I do not see "July"

  Scenario: An event that ended since the last build is hidden
    Given it is "2099-06-01T13:00:00+01:00"
    When I open "/calendar"
    Then the cards are, in order:
      | Fixture later     |
      | Fixture backwards |
    And I do not see "Could not find any events."

  Scenario: When every event has ended since the last build, the page says so
    Given it is "2100-01-01T00:00:00Z"
    When I open "/calendar"
    Then I do not see "Fixture future"
    And I see "Could not find any events."

  Scenario: Topic pages show upcoming events only
    When I open "/calendar/topic/church-events"
    Then I see "Topic: Church Events"
    And the cards are, in order:
      | Fixture future |
    When I open "/calendar/topic/other-events"
    Then I do not see "Fixture past"

  Scenario: No events
    When I open "/calendar" on the empty site
    Then I see "Could not find any events."
