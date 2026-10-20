Feature: Pages
  Standing pages at their live URLs, the contact page and the home page.

  Scenario: Pages keep their live URLs
    Then "/page/about/about-us" exists
    And "/page/services/easter-services-2026" exists
    And "/page/groups/church-groups" exists

  Scenario: Page types and the pages root are not pages
    Then "/page/about" does not exist
    And "/page" does not exist

  Scenario: A page
    When I open "/page/about/about-us"
    Then the page heading is "About Us"
    And the summary "About summary" is the lead
    And I see "About body."

  Scenario: A Markdown body
    When I open "/page/about/about-us"
    Then the body has a heading "Who we are"
    And the body has a list item "First item"
    And the body has a table with the header cells "Role, Name"
    And I see "***** Cancelled *****"
    And the body shows "1. Not a list" as text, not a numbered list
    And the "Solo picture" image is centred
    And the "Inline picture" image is not centred

  Scenario: The contact page
    When I open "/contact"
    Then the page heading is "Contact Us"

  Scenario: A page outside the known types still builds
    Then "/page/extra/stray" exists

  Scenario: The page types match live
    Then the real page types are, in order:
      | about        | About        | 40  |
      | services     | Services     | 50  |
      | groups       | Groups       | 60  |
      | community    | Community    | 70  |
      | links        | Links        | 80  |
      | gallery      | Gallery      | 90  |
      | forms        | Forms        | 100 |
      | safeguarding | Safeguarding | 110 |

  Scenario: The home page
    When I open "/"
    Then the hero shows "St Paul's Warton" and "Serving Christ - Serving the Community"
    And the hero image loads straight away
    And the "Church Notices" link goes to "/notices"
    And the home notices are exactly:
      | Fixture newer    |
      | Fixture older    |
      | Fixture migrated |
      | Fixture wide content with a very long title that has to wrap on a phone screen without pushing the page sideways |
      | Fixture images   |
    And the cards are, in order:
      | Fixture article 8 |
      | Fixture article 7 |
      | Fixture article 6 |
    And the "Fixture article 8" card image is 350 by 300

  Scenario: Every image on the home page has a description
    When I open "/"
    Then every image on the page has an alt attribute

  Scenario: The home page with no content
    When I open "/" on the empty site
    Then I do not see "Church Notices"
    And I see "Latest Blog Articles"
    And there are no cards

  Scenario: A page saved with an empty layout keeps the site around it
    When I open "/page/forms/blank-layout"
    Then the page heading is "Blank Layout"
    And the page has the site header and footer
    When I open "/page/forms/null-layout"
    Then the page heading is "Null Layout"
    And the page has the site header and footer

  Scenario: The hero is full width under the header, as on live
    Given a wide screen
    When I open "/"
    Then the hero fills the width of the window
    And the hero starts where the header ends
    And the hero image offers a 1024 pixel copy
    When I open "/page/about/about-us"
    Then the page heading is inside the page column

  Scenario: A hidden page is not on the site
    Then "/page/about/put-away" does not exist
    When I open "/"
    Then I do not see "Put Away"
    And I do not see "Only Hidden"
    And the main menu items are, in order:
      | Home     |
      | Blog     |
      | Calendar |
      | About    |
      | Services |
      | Groups   |
      | Gallery  |
    When I open "/sitemap"
    Then I do not see "Put Away"
    When I read the site map "/sitemap.xml"
    Then it does not list:
      | https://stpaulswarton.co.uk/page/about/put-away |
