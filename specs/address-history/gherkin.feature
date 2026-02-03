Feature: Address History Collection
  As a user filling out immigration forms
  I want to collect my address history
  So that I can complete my application

  Background:
    Given I am on the Address History step
    And I have not added any addresses yet

  Scenario: Add current address with all required fields
    Given I see the "Current Address" form
    When I enter "123 Main Street" in the street field
    And I enter "New York" in the city field
    And I select "NY" from the state dropdown
    And I enter "10001" in the ZIP field
    And I select "United States" from the country dropdown
    And I select "January" from the start month dropdown
    And I select "2020" from the start year dropdown
    And I blur the form
    Then my address should be saved to localStorage
    And I should see my address displayed in a card
    And the card should show "Current" badge
    And the card should show "Jan 2020 - Present"

  Scenario: Add current address with optional day
    Given I see the "Current Address" form
    When I enter a complete address
    And I enter "15" in the optional day field
    And I blur the form
    Then my address should be saved with day "15"
    And the card should show "Jan 15, 2020 - Present"

  Scenario: Auto-save on field blur
    Given I see the "Current Address" form
    When I enter "123 Main Street" in the street field
    And I blur the street field
    Then the address should be saved to localStorage
    And when I refresh the page
    Then "123 Main Street" should still be in the street field

  Scenario: Add previous address with draft/save flow
    Given I have added my current address starting "Jan 2020"
    When I click "Add Previous Address"
    Then I should see a new draft address form
    And the end date should be pre-filled to "Dec 2019" (month before current start)
    And the address should NOT be saved to localStorage yet
    When I enter a previous address
    And I enter a start date before the end date
    And I click "Save Address"
    Then the previous address should be validated
    And if valid, saved to localStorage
    And I should see it displayed in the "Previous Addresses" list
    And it should be sorted in reverse chronological order

  Scenario: Cancel discards draft address
    Given I have added my current address
    When I click "Add Previous Address"
    And I enter some address data
    And I click "Cancel"
    Then the draft should be discarded
    And no new address should be saved
    And I should see only the current address

  Scenario: Save blocked when validation fails
    Given I have added my current address
    When I click "Add Previous Address"
    And I leave required fields empty
    And I click "Save Address"
    Then I should see red borders on invalid fields
    And I should see validation error messages
    And the address should NOT be saved
    And the form should remain open for corrections

  Scenario: Detect and explain address gap
    Given I have added my current address starting "Jan 2020"
    When I add a previous address ending "Nov 2019"
    Then the system should detect a gap of more than 30 days
    And I should see a gap explanation dialog
    When I select "Traveling" as the reason
    And I provide additional details "International travel"
    And I save the explanation
    Then the gap explanation should be saved with the address
    And I should be able to continue

  Scenario: Edit an address
    Given I have added an address
    When I click "Edit" on the address card
    Then the card should change to an editable form
    And the form should be pre-filled with the address data
    When I change the city to "Los Angeles"
    And I blur the form
    Then the address should be updated
    And the card should show "Los Angeles"

  Scenario: Remove an address
    Given I have added an address
    When I click "Remove" on the address card
    And I confirm the removal
    Then the address should be removed from the list
    And it should be removed from localStorage
    And the remaining addresses should be re-validated

  Scenario: Validation - required fields
    Given I see the "Current Address" form
    When I try to blur the form without filling required fields
    Then I should see validation errors
    And the errors should indicate which fields are required
    And the address should not be saved

  Scenario Outline: Validation - invalid ZIP codes
    Given I see the "Current Address" form
    When I enter "<zip>" in the ZIP field
    And I select "<country>" from the country dropdown
    And I blur the ZIP field
    Then I should see "<error_message>"
    
    Examples:
      | zip    | country         | error_message                    |
      | 123    | United States   | ZIP code must be 5 digits       |
      | 12345  | United States   | (no error)                      |
      | ABC123 | Canada          | (no error - flexible for intl)  |
