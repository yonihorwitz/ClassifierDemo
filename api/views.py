from flask import request, Response, jsonify
from pymongo import errors
from bson.json_util import dumps
from . import app, db, executor
import time
import random

NUM_ENTRIES = 32

# Create NUM_ENTRIES classification entries in the database

def classify(keyword):
    for i in range(NUM_ENTRIES):
        label = "UNKNOWN"
        if random.randint(0, 1) == 1:
            label = "KWS_KERIDOS"
        else:
            label = "KWS_KERIDOS_YG"
        db.classifications.insert_one(
            {"index": i, "keyword": keyword, "label": label})
        time.sleep(1)
    db.batches.find_one_and_update(
        {"keyword": keyword}, {'$set': {"status": "done"}})


# Add a new batch
# Kick off a background process to create classification entries using classify()

@ app.route("/submitBatch", methods=['POST'])
def submitBatch():
    kw = request.get_json().get("keyword")
    db.batches.insert_one({"keyword": kw, "status": "working"})
    executor.submit(classify, kw)
    return {"message": "Batch created"}

# Get a list of all batches in the DB

@ app.route("/batches", methods=["GET"])
def getBatches():
    result = []
    for b in db.batches.find():
        result.append({'keyword': b['keyword']})
    return jsonify(result)

# Pull a list of classifications for the given keyword

@ app.route("/getClassifications/<keyword>/<length>/")
def getClassifications(keyword, length):
    def generate():
        status = db.batches.find_one({"keyword": keyword})["status"]
        classes = db.classifications.find(
            {"index": {"$gte": int(length)}, "keyword": keyword})
        yield bytes(dumps(classes), encoding='utf8')
        # status is not done - start watching the classification table for new entries, and stream them
        if status != "done":
            try:
                for insert_change in db.classifications.watch([{'$match': {'operationType': 'insert'}}]):
                    obj = insert_change["fullDocument"]
                    data = bytes(
                        dumps(obj), encoding='utf8')
                    # This should be the last entry, so we can return out of the Generator
                    if obj["index"] + 1 == NUM_ENTRIES:
                        return data
                    else:
                        yield data
            except errors.PyMongoError as py_mongo_error:
                print('Error in Mongo watch: %s' %
                      str(py_mongo_error))
    return Response(generate())
