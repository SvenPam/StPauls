Feature: Blog

  Scenario: Newest first, with summaries rather than full articles
    When I open "/blog"
    Then the page heading is "St. Pauls Blog"
    And the cards are, in order:
      | Fixture article 8 |
      | Fixture article 7 |
      | Fixture article 6 |
      | Fixture article 5 |
      | Fixture article 4 |
      | Fixture article 3 |
      | Fixture article 2 |
      | Fixture article 1 |
    And the "Fixture article 8" card shows "Published 01-Aug-15"
    And the "Fixture article 8" card shows "Article eight summary"
    And the "Fixture article 8" link goes to "/blog/article/a8"
    And I do not see "Lorem ipsum"

  Scenario: An article page
    When I open "/blog/article/a8"
    Then the page heading is "Fixture article 8"
    And I see "Published 01-Aug-15"
    And the summary "Article eight summary" is the lead
    And the image is a responsive picture described as "Wide"
    And I see "Body of article 8."
    And the "Website" link goes to "/blog/topic/website"

  Scenario: An article without a summary has no lead
    When I open "/blog/article/a2"
    Then there is no lead

  Scenario: The aside lists the topics and the seven newest articles
    When I open "/blog/article/a8"
    Then the aside "Blog Topics" list is, in order:
      | Church Events   |
      | Church Services |
      | Other Events    |
      | Website         |
    And the aside "Church Services" link goes to "/blog/topic/church-services"
    And the aside "Latest" list is, in order:
      | Fixture article 8 |
      | Fixture article 7 |
      | Fixture article 6 |
      | Fixture article 5 |
      | Fixture article 4 |
      | Fixture article 3 |
      | Fixture article 2 |

  Scenario: A migrated article keeps its live URL
    Then "/blog/article/st-pauls-churchyard-in-bloom" exists

  Scenario: A topic page is the blog, filtered
    When I open "/blog/topic/website"
    Then the page heading is "St. Pauls Blog"
    And I see "Topic: Website"
    And the cards are, in order:
      | Fixture article 8 |
    And the aside "Latest" list is, in order:
      | Fixture article 8 |
      | Fixture article 7 |
      | Fixture article 6 |
      | Fixture article 5 |
      | Fixture article 4 |
      | Fixture article 3 |
      | Fixture article 2 |

  Scenario: An article names its author, as on live
    When I open "/blog/article/a2"
    Then I see "by Ann Example"
    When I open "/blog"
    Then the "Fixture article 2" card shows "by Ann Example"
    When I open "/blog/article/a8"
    Then I do not see "by "

  Scenario: Home cards show no author
    When I open "/"
    Then I do not see "by Ann Example"

  Scenario: A card with no picture of its own uses the first picture in the body, else a stock picture
    When I open "/blog"
    Then the "Fixture article 1" card picture comes from "/images/generic-"
    And the "Fixture article 1" card picture is decorative

  Scenario: The card button reads as on live and still names the article
    When I open "/blog"
    Then the "Fixture article 8" card has a "Read →" link named "Read about Fixture article 8"
