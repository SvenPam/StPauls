Feature: Event dates
  Live's event rules. The clock site is built at 2030-06-15 12:00 UK time.

  Scenario: An event that starts and ends on the same day
    When I open "/calendar/event/future-same-day" on the clock site
    Then the event starts "10:00 June 20"
    And the event ends "12:00 June 20"
    And I see "4 days to go"

  Scenario: An event over two days
    When I open "/calendar/event/future-two-days" on the clock site
    Then the event starts "20 Jun 10:00"
    And the event ends "21 Jun 09:00"

  Scenario: The same day number a month later is not the same day
    When I open "/calendar/event/same-day-next-month" on the clock site
    Then the event starts "20 Jun 10:00"
    And the event ends "20 Jul 10:00"

  Scenario: An event with no end
    When I open "/calendar/event/soon" on the clock site
    Then the event starts "15 Jun 15:30"
    And the event has no end
    And I see "3 hours to go"

  Scenario: An event with no end is in progress for a day
    When I open "/calendar/event/active-no-end" on the clock site
    Then I see "In Progress"
    When I open "/calendar/event/ended-no-end" on the clock site
    Then I see "Expired"
