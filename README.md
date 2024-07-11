# Moonbeam explorer frame using subquery

## Getting Started
Users can input the transaction hash and can instantly get the glimpse of status of their transaction. They can also redirect to the moonbeam scan on a click of a button if they want to see further details. 

The frame is using subquery managed service to query the moonbeam blockchain https://explorer.subquery.network/subquery/kumawallet/kuma-moonbeam

The frame is live and working on https://every-hairs-do.loca.lt/

### Usage Guide
- Enter the txn hash. We are using *0x6ca9621b1ea3530d264119cfaf83c1c589ecff2c8998ac4394f04b94fe584a6e* for example and hit search.
  
   <img width="507" alt="Screenshot 2024-07-11 at 6 47 20 PM" src="https://github.com/cpp-phoenix/moonbean-scan-frame/assets/32295047/9f8a9a3f-eb95-4b2f-8959-b973dbd40662">
  
- If the txn is valid you'll get the block number and the txn status. Otherwise you'll get the error
  
   <img width="506" alt="Screenshot 2024-07-11 at 6 49 02 PM" src="https://github.com/cpp-phoenix/moonbean-scan-frame/assets/32295047/3399c603-dc52-48c2-a04c-5c92dc423e93">

- You can then either click go back to search for another txn or you can click on explorer link. Which will redirect you to moonbeam explorer.
