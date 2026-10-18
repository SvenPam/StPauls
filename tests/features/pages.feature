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

  Scenario: The contact placeholder
    When I open "/contact"
    Then the page heading is "Contact Us"
    And I see "PR4 1BD"
    And the "Church contact list" link goes to "/page/about/contact-list"

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
