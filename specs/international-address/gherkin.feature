Feature: International Address Support
  As a user filling out immigration forms
  I want to enter addresses from any country
  So that my application includes accurate address history

  Background:
    Given I am on the address form page

  Scenario: Canadian address with province dropdown
    When I select "Canada" as the country
    Then the state field label shows "Province"
    And the postal code field label shows "Postal Code"
    And the state field is a dropdown with 13 options
    When I select "ON" from the province dropdown
    And I enter "M9C 3K6" as the postal code
    Then the form validates successfully

  Scenario: US address with state dropdown
    When I select "United States" as the country
    Then the state field label shows "State"
    And the postal code field label shows "ZIP Code"
    And the state field is a dropdown with 56 options
    When I select "CA" from the state dropdown
    And I enter "95112" as the ZIP code
    Then the form validates successfully

  Scenario: Mexican address with state dropdown
    When I select "Mexico" as the country
    Then the state field label shows "State"
    And the postal code field label shows "Postal Code"
    And the state field is a dropdown with 32 options
    When I select "CDMX" from the state dropdown
    And I enter "06600" as the postal code
    Then the form validates successfully

  Scenario: Indian address with free-text state
    When I select "India" as the country
    Then the state field label shows "State / Province"
    And the state field is a text input
    When I enter "Maharashtra" as the state
    And I enter "400001" as the postal code
    Then the form validates successfully

  Scenario: UK address with postcode
    When I select "United Kingdom" as the country
    Then the state field is a text input
    When I enter "Greater London" as the state
    And I enter "SW1A 1AA" as the postal code
    Then the form validates successfully

  Scenario: Country without postal codes
    When I select "Ireland" as the country
    And I enter "Dublin" as the city
    And I leave the postal code empty
    Then the form validates successfully

  Scenario: Form labels update on country change
    Given I have selected "United States" as the country
    And the state label shows "State"
    When I change the country to "Canada"
    Then the state label shows "Province"
    And the postal code label shows "Postal Code"

  Scenario: Postal code validation by country
    When I select "United States" as the country
    And I enter "ABCDE" as the ZIP code
    Then I see a validation error for ZIP code format
    When I select "Canada" as the country
    And I enter "12345" as the postal code
    Then I see a validation error for postal code format
    When I enter "M9C 3K6" as the postal code
    Then the postal code validates successfully
