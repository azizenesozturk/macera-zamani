import json
from functools import wraps
from flask import Flask, render_template, request, jsonify, session
from database import get_connection, init_db

app = Flask(__name__)
app.secret_key = "bu-anahtari-degistir-kimse-bilmesin-12345"

EDIT_PASSWORD = "boklu"  # Ekleme/silme icin gereken sifre - istersen degistir


def edit_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("can_edit"):
            return jsonify({"error": "auth_required"}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/api/unlock", methods=["POST"])
def unlock():
    data = request.get_json()
    entered = data.get("password", "")
    if entered == EDIT_PASSWORD:
        session["can_edit"] = True
        return jsonify({"unlocked": True})
    return jsonify({"unlocked": False, "error": "Sifre yanlis"}), 403


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/places", methods=["GET"])
def get_places():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM places ORDER BY id DESC").fetchall()
    conn.close()
    places = [dict(row) for row in rows]
    return jsonify(places)


@app.route("/api/places", methods=["POST"])
@edit_required
def add_place():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description", "")
    category = data.get("category", "diger")
    lat = data.get("lat")
    lng = data.get("lng")

    if not name or lat is None or lng is None:
        return jsonify({"error": "name, lat ve lng zorunludur"}), 400

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO places (name, description, category, lat, lng) VALUES (?, ?, ?, ?, ?)",
        (name, description, category, lat, lng)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "id": new_id, "name": name, "description": description,
        "category": category, "lat": lat, "lng": lng
    }), 201


@app.route("/api/places/<int:place_id>", methods=["DELETE"])
@edit_required
def delete_place(place_id):
    conn = get_connection()
    conn.execute("DELETE FROM places WHERE id = ?", (place_id,))
    conn.commit()
    conn.close()
    return jsonify({"deleted": place_id})


@app.route("/api/routes", methods=["GET"])
def get_routes():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM routes ORDER BY id DESC").fetchall()
    conn.close()

    routes = []
    for row in rows:
        route = dict(row)
        route["points"] = json.loads(route["points"])
        routes.append(route)

    return jsonify(routes)


@app.route("/api/routes", methods=["POST"])
@edit_required
def add_route():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description", "")
    category = data.get("category", "yuruyus")
    points = data.get("points")

    if not name or not points or len(points) < 2:
        return jsonify({"error": "name ve en az 2 noktali points zorunludur"}), 400

    points_json = json.dumps(points)

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO routes (name, description, category, points) VALUES (?, ?, ?, ?)",
        (name, description, category, points_json)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "id": new_id, "name": name, "description": description,
        "category": category, "points": points
    }), 201


@app.route("/api/routes/<int:route_id>", methods=["DELETE"])
@edit_required
def delete_route(route_id):
    conn = get_connection()
    conn.execute("DELETE FROM routes WHERE id = ?", (route_id,))
    conn.commit()
    conn.close()
    return jsonify({"deleted": route_id})


if __name__ == "__main__":
    init_db()
    app.run(debug=False)