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

  Scenario: A calendar card reads like live
    When I open "/calendar" on the clock site
    Then the "Soon event" card shows "15"
    And the "Soon event" card shows "Soon"
    And the "Soon event" card shows "15:30"
    And the "Soon event" card shows "June"
    And the "Soon event" card shows "Church Hall"
    And the "Soon event" card shows "Soon event summary"
    And the "Soon event" card has no topic
    And the "Active no end" card shows "In Progress"
    And the "July event" card has no status

  Scenario: The calendar page title and heading
    When I open "/calendar" on the clock site
    Then the page heading is "Upcoming Events"
    And the page title is "Calendar | St Paul's Warton"

  Scenario: Calendar topic pages keep past events, soonest first
    When I open "/calendar/topic/church-events" on the clock site
    Then the cards are, in order:
      | Ended no end  |
      | Active no end |
      | Minutes event |
      | Soon event    |
      | Same day      |
      | Two days      |
      | Next month    |
      | July event    |

  Scenario: The home page lists upcoming events by month
    When I open "/" on the clock site
    Then the "Upcoming Events" link goes to "/calendar"
    And the home events are:
      | June | 14 | Active no end | Active |
      | June | 15 | Minutes event | Soon   |
      | June | 15 | Soon event    | Soon   |
      | June | 20 | Same day      | Soon   |
      | June | 20 | Two days      | Soon   |
      | June | 20 | Next month    | Soon   |
      | July | 5  | July event    |        |

  Scenario: No upcoming events, no column
    When I open "/" on the empty site
    Then I do not see "Upcoming Events"

  Scenario: The countdown follows the visitor's clock
    When I open "/calendar/event/soon" on the clock site at "2030-06-15T15:00:00+01:00"
    Then I see "30 minutes to go"
    When I open "/calendar/event/soon" on the clock site at "2030-06-15T16:00:00+01:00"
    Then I see "In Progress"

  Scenario: Labels follow the visitor's clock
    When I open "/calendar" on the clock site at "2030-06-15T16:00:00+01:00"
    Then the "Soon event" card shows "In Progress"
    When I open "/" on the clock site at "2030-06-15T16:00:00+01:00"
    Then the home event "Soon event" is labelled "Active"

  Scenario: The home column drops events and months that have ended
    When I open "/" on the clock site at "2030-06-20T12:30:00+01:00"
    Then the home events are:
      | June | 20 | Two days   | Active |
      | June | 20 | Next month | Active |
      | July | 5  | July event |        |
    When I open "/" on the clock site at "2030-07-10T12:00:00+01:00"
    Then the home events are:
      | June | 20 | Next month | Active |
    And the home event months shown are "June"

  Scenario: The home column goes when every event has ended
    When I open "/" on the clock site at "2030-08-01T00:00:00+01:00"
    Then I do not see "Upcoming Events"
