from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)

SECRET_KEY = "mysecretkey"

# Temporary in-memory storage
users = {}
tasks = []
task_id_counter = 1


# ---------------- JWT Required Decorator ----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = data['username']
        except:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ROUTES FOR FRONTEND PAGES
@app.route("/")
def home():
    return redirect(url_for("login_page"))

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/signup")
def signup_page():
    return render_template("signup.html")

@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")


# ---------------- AUTHENTICATION APIs ----------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    user = data.get("username")
    password = data.get("password")

    if user in users:
        return jsonify({"error": "User already exists"}), 400

    users[user] = password
    return jsonify({"message": "Signup successful"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = data.get("username")
    password = data.get("password")

    if user not in users or users[user] != password:
        return jsonify({"error": "Invalid username or password"}), 401

    token = jwt.encode({
        "username": user,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})


# ---------------- TASK CRUD APIs ----------------
@app.route("/tasks", methods=["GET"])
@token_required
def get_tasks(current_user):
    user_tasks = [t for t in tasks if t['user'] == current_user]
    return jsonify(user_tasks)


@app.route("/tasks", methods=["POST"])
@token_required
def add_task(current_user):
    global task_id_counter
    data = request.json
    text = data.get("text")

    new_task = {
        "id": task_id_counter,
        "text": text,
        "user": current_user
    }
    tasks.append(new_task)
    task_id_counter += 1

    return jsonify({"message": "Task added"})


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user, task_id):
    global tasks
    tasks = [t for t in tasks if not (t['id'] == task_id and t['user'] == current_user)]
    return jsonify({"message": "Task deleted"})


#  EDIT TASK API (added)
@app.route("/tasks/<int:task_id>", methods=["PUT"])
@token_required
def update_task(current_user, task_id):
    data = request.get_json()   # ← FIXED LINE
    new_text = data.get("text")

    for task in tasks:
        if task["id"] == task_id and task["user"] == current_user:
            task["text"] = new_text
            return jsonify({"message": "Task updated"})

    return jsonify({"error": "Task not found"}), 404
if __name__ == "__main__":
    app.run(debug=True)

