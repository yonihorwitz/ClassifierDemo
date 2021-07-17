from flask import request, Response, jsonify
from pymongo import errors
from bson.json_util import dumps
from . import app, db, executor
import time
import random

NUM_ENTRIES = 32


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


@ app.route("/submitBatch", methods=['POST'])
def submitBatch():
    kw = request.get_json().get("keyword")
    db.batches.insert_one({"keyword": kw, "status": "working"})
    executor.submit(classify, kw)
    return {"message": "Batch created"}


@ app.route("/batches", methods=["GET"])
def getBatches():
    result = []
    for b in db.batches.find():
        result.append({'keyword': b['keyword']})
    return jsonify(result)


@ app.route("/getClassifications/<keyword>/<length>/")
def getClassifications(keyword, length):
    def generate():
        status = db.batches.find_one({"keyword": keyword})["status"]
        classes = db.classifications.find(
            {"index": {"$gte": int(length)}, "keyword": keyword})
        yield bytes(dumps(classes), encoding='utf8')
        if status != "done":
            try:
                for insert_change in db.classifications.watch([{'$match': {'operationType': 'insert'}}]):
                    obj = insert_change["fullDocument"]
                    print("Index", obj["index"])
                    data = bytes(
                        dumps(obj), encoding='utf8')
                    if obj["index"] + 1 == NUM_ENTRIES:
                        return data
                    else:
                        yield data
            except errors.PyMongoError as py_mongo_error:
                print('Error in Mongo watch: %s' %
                      str(py_mongo_error))
    return Response(generate())
