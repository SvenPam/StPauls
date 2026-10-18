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

  Scenario: The church diary is a sandboxed, responsive calendar
    When I open "/page/about/church-diary"
    Then the page embeds "https://calendar.google.com/calendar/embed?src=wartonstpauls%40gmail.com&ctz=Europe/London" titled "Church diary"
    And the embed is 4 by 3

  Scenario: A protocol-relative gallery address is loaded over https
    When I open "/page/gallery/church-gallery"
    Then the page embeds "https://embedsocial.com/facebook_album/album_photos/866062123490460" titled "Photos from the church Facebook page"

  Scenario: An embed on another host shows nothing
    When I open "/page/gallery/bad-host"
    Then the page has no embed
    When I open "/page/gallery/script-url"
    Then the page has no embed
