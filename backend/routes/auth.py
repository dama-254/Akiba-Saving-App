from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User, Account

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _auth_payload(user):
    return {
        "token": create_access_token(identity=str(user.id)),
        "user": user.to_dict(),
        "account": user.account.to_dict(),
    }


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    pin = str(data.get("pin") or "")

    if not name or not email or not password or not pin:
        return jsonify({"error": "name, email, password and PIN are all required"}), 400
    if len(password) < 8:
        return jsonify({"error": "password must be at least 8 characters"}), 400
    if not (pin.isdigit() and len(pin) == 4):
        return jsonify({"error": "PIN must be exactly 4 digits"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "an account with that email already exists"}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    user.set_pin(pin)
    db.session.add(user)
    db.session.flush()  # assigns user.id without committing yet
    db.session.add(Account(user_id=user.id))
    db.session.commit()

    return jsonify(_auth_payload(user)), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if user and user.is_locked():
        seconds = (user.locked_until - datetime.utcnow()).total_seconds()
        minutes = max(1, int(seconds // 60) + 1)
        return jsonify(
            {"error": f"account locked after too many failed attempts. Try again in {minutes} minute(s)"}
        ), 423

    if not user or not user.check_password(password):
        if user:
            user.register_failed_login()
            db.session.commit()
        return jsonify({"error": "invalid email or password"}), 401

    user.reset_failed_logins()
    db.session.commit()
    return jsonify(_auth_payload(user)), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": user.to_dict(), "account": user.account.to_dict()}), 200
