Feature: Contact form and site settings
  The footer and the contact page read Site settings. The form shows once a Web3Forms key is set.

  Scenario: The footer comes from settings
    When I open "/notices" on the site with a contact key
    Then the footer shows "St Paul's & Hall"
    And the footer "Find us on Facebook" link goes to "https://www.facebook.com/fixture"
