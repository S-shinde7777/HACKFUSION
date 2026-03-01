# Hackfusion Final

This project is a simple medicine management application with both frontend and backend components. It includes a basic AI chatbot for medicine-related queries.

## Agents architecture

To modularize the AI functionality, we've introduced three "agents":

1. **Conversation Agent** (`agents/conversationAgent.js`)
   - Orchestrates the chat flow
   - Applies safety checks using the safety agent
   - Detects simple commands and forwards them to the action agent
   - Falls back to the language model (Gemini) for general conversation

2. **Safety Agent** (`agents/safetyAgent.js`)
   - Performs rudimentary input filtering to block unsafe messages
   - Can be extended with more complex policies as needed

3. **Action Agent** (`agents/actionAgent.js`)
   - Executes side-effect operations (e.g. adding a medicine)
   - Exposes a generic `perform(actionName, payload)` helper that can be extended

## Usage

The `/api/chat` endpoint in `routes/aiRoutes.js` now delegates to the conversation agent. Example input formats:

- **Regular question**: "What is the typical dosage for ibuprofen?"
- **Action command**: `add medicine name=aspirin stock=100 prescriptionRequired=false`

Additionally, the patient request workflow has been enhanced: when a patient submits a request via `/api/add-request`, the server checks medicine stock. If sufficient inventory exists for the requested quantity, the request is automatically marked `accepted` and the medicine stock is decremented. Otherwise the request remains `pending` for pharmacist review.

## Price & Stock Management

- Each medicine record now contains `stock` and `price` fields.
- The pharmacist dashboard displays both columns and includes an "Edit" button that allows updating stock, price, name, and prescription requirement.
- The `POST /api/add-medicine` route accepts `price` as well as `name`, `stock`, and `prescriptionRequired`.
- A new route `PUT /api/medicines/:id` can be used programmatically to update a medicine.

## Importing Products

- Place an Excel file (`products-export.xlsx`, `product_export.xlsx`, `products-export.xlsx`, etc.) in the `data/` directory; the first sheet should contain headers such as `product id`, `product name`, `price rec`, and optionally `stock`.
- Call `POST /api/import-products` to import the spreadsheet into `medicines.json`. Existing stock values are preserved when medicines match by ID or name.
- The import maps the price column and any available stock; unmatched stock defaults to 0.


The front end can continue to post to `/api/chat` as before; the logic is now more modular.

## Extending

- Add new actions in `agents/actionAgent.js` and update intent detection in the conversation agent.
- Improve safety rules in `agents/safetyAgent.js`.

