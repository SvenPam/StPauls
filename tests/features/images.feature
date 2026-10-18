Feature: Images
  Uploads reach a phone as small WebP files. Anything else still fits.

  Scenario: Uploads in a body are responsive pictures
    When I open "/notices/notice/images"
    Then the "Wide one" image is a responsive picture at widths "480, 800, 1200, 1600"
    And the "Wide one" image is 800 by 450
    And the "Quote \" and > inside" image is a responsive picture at widths "480, 800, 1200, 1600"
    And the "Spaces" image is a responsive picture at widths "480, 800"

  Scenario: Other images stay as they are and load lazily
    When I open "/notices/notice/images"
    Then the "Hot linked" image comes from "https://media.acny.uk/x.jpg" and loads lazily
    And the "Gone" image comes from "/uploads/deleted.jpg" and loads lazily
    And the "Gif" image comes from "/uploads/fixture.gif" and loads lazily

  Scenario: Big images never push the page sideways
    Given a phone screen
    When I open "/notices/notice/images"
    Then the page does not scroll sideways
