Feature: Main menu
  The menu works without script. The script only adds keyboard and screen reader niceties.

  Background:
    Given a phone screen

  Scenario: The menu button opens and closes the menu
    When I open "/notices"
    Then the main menu is hidden
    And the menu button says the menu is closed
    When I press the menu button
    Then the main menu is shown
    And the menu button says the menu is open
    When I press the menu button
    Then the main menu is hidden

  Scenario: The menu button is big enough to tap
    When I open "/notices"
    Then the menu button is at least 44 by 44 pixels

  Scenario: The menu and its dropdowns open without script
    Given scripts are off
    When I open "/notices"
    And I press the menu button
    Then the main menu is shown
    When I open the "About" menu
    Then the "About" menu shows "Privacy Policy"

  Scenario: Escape closes an open dropdown and keeps focus on it
    When I open "/notices"
    And I press the menu button
    And I open the "About" menu
    Then the "About" menu is open
    When I press Escape
    Then the "About" menu is closed
    And focus is on the "About" menu
    When I press Escape
    Then the main menu is hidden

  Scenario: Clicking elsewhere closes an open dropdown
    When I open "/notices"
    And I press the menu button
    And I open the "Services" menu
    And I click the page heading
    Then the "Services" menu is closed

  Scenario: Tapping another dropdown while one is open opens it and closes the first
    When I open "/notices"
    And I press the menu button
    And I open the "About" menu
    And I open the "Gallery" menu
    Then the "About" menu is closed
    And the "Gallery" menu is open

  Scenario: The skip link comes first
    When I open "/notices"
    And I press Tab
    Then focus is on the "Skip to content" link

  Scenario: The menu follows the pages
    When I open "/notices"
    And I press the menu button
    Then the main menu items are, in order:
      | Home     |
      | Blog     |
      | Calendar |
      | About    |
      | Services |
      | Groups   |
      | Gallery  |
    And the "Groups" link goes to "/page/groups/church-groups" in the menu
    And the "About" menu lists, in order:
      | About Us       |
      | Contact Us     |
      | Privacy Policy |
    And the "Services" menu lists, in order:
      | Easter Services 2026    |
      | Regular Church Services |

  Scenario: The footer follows the pages
    When I open "/notices"
    Then the footer groups are, in order:
      | Links    |
      | Services |
      | Groups   |
      | Gallery  |
    And the "Links" footer group links to, in order:
      | /blog                      |
      | /calendar                  |
      | /notices                   |
      | /sitemap                   |
      | /contact                   |
      | /page/about/privacy-policy |
