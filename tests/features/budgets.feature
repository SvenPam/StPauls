Feature: Delivery budgets
  Small pages, our own script only, images that never jump, nothing stored.

  Scenario: New-tab links cannot reach back into the site
    When I open "/notices/notice/links"
    Then every link that opens a new tab has "noopener"

  Scenario: The home page is light on first load
    When I open "/"
    Then the page, its stylesheet, script and hero image add up to under 400000 bytes

  Scenario Outline: Every page loads only our script, sized and described images, and our fonts
    When I open "<page>"
    Then the only script is our own
    And every image on the page has an alt attribute
    And every local image has a width and height
    And at most one image loads straight away
    And every font comes from "/fonts/"

    Examples:
      | page                     |
      | /                        |
      | /blog/article/a8         |
      | /notices/notice/images   |
      | /page/about/church-diary |
      | /calendar                |

  Scenario: The site stores nothing in the browser
    When I open "/"
    And I open "/contact"
    And I open "/blog/article/a8"
    Then the site has set no cookies and stored nothing
