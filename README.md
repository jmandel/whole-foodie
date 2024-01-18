# Whole Foodie

## Run local component

```sh
chromium   --remote-debugging-port=9222 --user-data-dir=cuser/
tailscale funnel 3000
npm install
npm index.js
```

## Custom GPT Details

### Instructions
````
Request grocery items by SubmitRequest with

## Instructions
```
type GroceryItemRequest = GroceryItemRequestInitial | GroceryItemRequestFollowUp;

interface GroceryItemRequestInitial {
  request: {
    recipeName: string;
    item: {
      name: string;
      quantity: {
        amount: number;
        unit: string;
      };
      preferences?: {
        brand?: string;
        organic?: boolean;
        local?: boolean;
      };
    };
  }
}

interface GroceryItemRequestFollowUp {
  request: {
    requestId: string // populate based on response from initial request
    selectItemId: number // choose an itemId from initial response
    selectItemQuantity: number // how many of that item to purchase -- think aloud, see note
  }
}
```

Note 1: When doing GroceryItemRequestFollowUp consider the set of items available. In one line (no more than 75 words total), think aloud to narrow down the options based on these values:
* Fresh and Simple: Skip pre-chopped, plastic-wrapped dreams. Grab in-season beauties.
* Unit Price Deals: Calculate price per unit for a fair fight.

When doing math to compare quantities, convert the total amount we need into a "# to purchase" based on the search result item description.  For example if you need 5 lb carrots and you are looking at an item like "1 bunch", estimate that a bunch weighs 2.5 lb and therefore populate selectItemQuantity with 2. Do careful math and state your assumptions briefly.
````

### Action Config (1/2): GetRecipe

````json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Get Recipe Data",
    "description": "Retrieves Recipe JSON from URL.",
    "version": "v1.0.0"
  },
  "servers": [
    {
      "url": "https://ld.fly.dev"
    }
  ],
  "paths": {
    "/": {
      "get": {
        "description": "Get recipe JSON",
        "operationId": "GetRecipeJSON",
        "parameters": [
          {
            "name": "url",
            "in": "query",
            "description": "URL of recipe to retrieve",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "deprecated": false
      }
    }
  },
  "components": {
    "schemas": {}
  }
}
````

### Action Config (2/2): Browser Control

````
{
  "openapi": "3.0.0",
  "info": {
    "title": "Example API",
    "version": "1.0.0"
  },
"servers": [{"url": "https://<funnel-subdomain>.ts.net"}],
  "paths": {
    "/request": {
      "post": {
        "summary": "Submit a grocery request",
       "operationId": "SubmitRequest",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object","properties": {"requestId": {}, "request": {}},
                "additionalProperties": true
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Request accepted"
          }
        }
      }
    }
  }
}
````
