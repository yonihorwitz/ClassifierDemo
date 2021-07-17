from flask import Flask  # Import the Flask class
from flask_cors import CORS
from pymongo import MongoClient
from flask_executor import Executor

app = Flask(__name__)    # Create an instance of the class for our use
executor = Executor(app)
CORS(app, resources={r"/*": {"origins": "*"}})
mongo = MongoClient(
    host=["mongodb://host.docker.internal:30001/"],
    serverSelectionTimeoutMS=10000)
db = mongo.classifier
