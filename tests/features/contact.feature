Feature: Contact form and site settings
  The footer and the contact page read Site settings. The form shows once a Web3Forms key is set.

  Scenario: The footer comes from settings
    When I open "/notices" on the site with a contact key
    Then the footer shows "St Paul's & Hall"
    And the footer "Find us on Facebook" link goes to "https://www.facebook.com/fixture"

  Scenario: Without a key the contact page shows the address
    When I open "/contact"
    Then there is no contact form
    And I see "PR4 1BD"
    And the "Church contact list" link goes to "/page/about/contact-list"

  Scenario: The form posts to Web3Forms and comes back to the real domain
    When I open "/contact" on the site with a contact key
    Then the contact form posts to "https://api.web3forms.com/submit"
    And the form sends "access_key" as "0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a"
    And the form sends "from_name" as "St Paul's Warton website"
    And the form sends "redirect" as "https://stpaulswarton.co.uk/contact/thanks"

  Scenario: Every field is labelled
    When I open "/contact" on the site with a contact key
    Then the "Name" field is required
    And the "Enquiry type" field is required
    And the "Message" field is required
    And the "Email" field is required
    And the "Phone (optional)" field is optional
    And the enquiry types are, in order:
      | General Enquiry       |
      | Website Enquiry       |
      | Weddings and Baptisms |
      | MU                    |
      | WI                    |
    And the "privacy policy" link goes to "/page/about/privacy-policy"

  Scenario: The spam trap is invisible
    When I open "/contact" on the site with a contact key
    Then the spam trap is hidden and cannot be reached with Tab

  Scenario: The subject carries the enquiry type
    When I open "/contact" on the site with a contact key
    And I choose "Weddings and Baptisms" as the enquiry type
    Then the form sends "subject" as "Website enquiry: Weddings and Baptisms"

  Scenario: Without script the subject is the plain one
    Given scripts are off
    When I open "/contact" on the site with a contact key
    Then the form sends "subject" as "Website enquiry"

  Scenario: The thanks page
    When I open "/contact/thanks"
    Then the page heading is "Thank you"
    And the "home page" link goes to "/"
