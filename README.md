# Classifier - Fun times with Python, Docker, and Mongo

- This app is an attempt to build an app that displays classification results of submitted data.
- To run the app locally, you must have Docker installed.
  1. Clone this repository onto VS Code
  2. Compose up by right-clicking on docker-compose.yml, and wait for the installations to complete.
  3. Open the app on http://localhost:3000/
  4. It's recommended to wait a bit before using the UI - there may be bugs on the first attempt to create a batch...

# Functionality

The Classifier creates "batches" of random results, and stores them along with a name you choose. On the UI, type a name into the input box, and hit the button. The server will begin classifying 32 results based on KWS_KERIDOS or KWS_KERIDOS_YG, and feed the data back to the UI in real-time. While you're waiting for that data to load, you can use the drop-down of existing batches to view other results as they come in.

# How it's built

When a batch name is submitted, the Python Flask back-end creates a new entry in the _batches_ MongoDB table, and kicks off a background process using Flask Executor to add _classification_ entries for that batch. These entries are added in randomly, one second apart.

The UI also sends a request into Flask to send all classifications tied to the batch name, as well as subscribing to a listener that captures any new entries to the _classifications_ table, streaming those results back as well.
