Feature: Pages CMS
  What Paul can edit, and what a save must never lose.

  Background:
    Given the Pages CMS config

  Scenario: Collections and where they save
    Then the "blog" collection saves to "site/content/blog"
    And the "events" collection saves to "site/content/calendar"
    And the "notices" collection saves to "site/content/notices"

  Scenario: A save keeps a migrated item's live URL
    Then saving keeps front matter the form does not show
    And the "blog" collection has a hidden "url" field
    And the "events" collection has a hidden "url" field
    And the "notices" collection has a hidden "url" field

  Scenario: Bodies are saved as Markdown
    Then every rich text field saves Markdown

  Scenario: Event times are saved in a form the site reads
    Then the "events" collection saves "date" as date and time "yyyy-MM-dd'T'HH:mm:ss"
    And the "events" collection saves "end" as date and time "yyyy-MM-dd'T'HH:mm:ss"

  Scenario: Topics match the site's topics
    Then the "blog" collection offers the site topics as "blogtopics"
    And the "events" collection offers the site topics as "eventtopics"
    And the "notices" collection offers the site topics as "noticetopics"

  Scenario: A title of "Index" cannot replace a section page
    Then a title of "Index" is refused
    And a title of "index" is refused
    And a title of "Index of hymns" is allowed

  Scenario: Whatever Paul has saved builds
    Then the real content builds

  Scenario: The home page is one entry Paul cannot delete
    Then the "home" entry edits the file "site/content/_index.md"
    And the "home" entry has the fields "title, lead, hero_image, hero_alt"

  Scenario: Site settings are one entry Paul cannot delete
    Then the "settings" entry edits the file "site/data/settings.yaml"
    And the "settings" entry has the fields "contact_access_key, contact_subject, enquiry_types, address, facebook_url, map_url, directions_url"

  Scenario: A contact key Paul pastes
    Then a contact key of "0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a" is allowed
    And a contact key of "" is allowed
    And a contact key of " 0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a" is refused
    And a contact key of "0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a\n" is refused
    And a contact key of "<input value=\"0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a\">" is refused

  Scenario: Pages are grouped by type in menu order
    Then the "pages" group holds, in order:
      | page-about        |
      | page-services     |
      | page-groups       |
      | page-community    |
      | page-links        |
      | page-gallery      |
      | page-forms        |
      | page-safeguarding |
    And every page collection saves to its type folder with the fields "title, summary, header, footer, weight, image, image_alt, body, embed, embed_src, url, layout"
    And the "page-about" collection has a hidden "url" field
    And the "page-about" collection has a hidden "layout" field

  Scenario: Embed types match the site's embeds
    Then the "page-about" collection offers the site embeds as "embed"

  Scenario: Notices have a start and an optional end date
    Then the "notices" collection has a required date "date" labelled "Show from"
    And the "notices" collection has an optional date "until" labelled "Show until"

  Scenario: Articles have a required author
    Then the "blog" collection has a required string "author" labelled "Author"
