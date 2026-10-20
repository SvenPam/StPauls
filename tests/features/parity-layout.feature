Feature: Menus and layout, as on live

  Scenario: The About menu has a divider before the policies
    When I open "/"
    Then the "About" menu has a divider between "Contact Us" and "Privacy Policy"

  Scenario: The menu highlights the section you are in
    When I open "/blog/article/a8"
    Then the "Blog" menu item is highlighted
    When I open "/calendar/event/future"
    Then the "Calendar" menu item is highlighted
    When I open "/page/about/about-us"
    Then the "About" menu item is highlighted
    When I open "/"
    Then the "Home" menu item is highlighted
    And the "Blog" menu item is not highlighted

  Scenario: Back to top shows once the page has scrolled
    Given a phone screen
    When I open "/blog"
    Then the "Back to top" link is hidden
    When I scroll to the bottom
    Then the "Back to top" link is shown
    And the "Back to top" link anywhere on the page goes to "#main"

  Scenario: The footer map is hidden on a phone
    Given a phone screen
    When I open "/"
    Then the footer map is hidden

  Scenario: The footer map shows on a wide screen
    Given a wide screen
    When I open "/"
    Then the footer map is shown

  Scenario: The blog aside is hidden on a phone and in print
    Given a phone screen
    When I open "/blog"
    Then the blog aside is hidden
    Given a wide screen
    When I print "/blog"
    Then the blog aside is hidden
    And the "Back to top" link is hidden

