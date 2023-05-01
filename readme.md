# States
an `express` and `mongoose` api that manages metadata for each member state.

### this api merges two separate sources of information:
1. `models/states.json`: holds metadata for each state, as provided by an archived civil services repository.
2. `mongo` **remote database**: holds additional fun facts for each state, as provided by users of the api.

### this api uses an internal cache:
- `models/store.js` serves as an internal cache, merging both sources of information.  
- this store enables the api to respond to `get` requests w/out communicating w/ the database.

the entry point of this program is `controllers/index.js`.