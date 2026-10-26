from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Goal, Deposit

deposits_bp = Blueprint("deposits", __name__, url_prefix="/api")


def _get_owned_goal(goal_id, user_id):
    return Goal.query.filter_by(id=goal_id, user_id=user_id).first()


@deposits_bp.post("/goals/<int:goal_id>/deposits")
@jwt_required()
def add_deposit(goal_id):
    user_id = get_jwt_identity()
    goal = _get_owned_goal(goal_id, user_id)
    if not goal:
        return jsonify({"error": "goal not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        amount = float(data.get("amount"))
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a positive number"}), 400

    note = (data.get("note") or "").strip() or None
    deposit = Deposit(goal_id=goal.id, amount=amount, note=note)
    db.session.add(deposit)
    db.session.commit()
    return jsonify(deposit.to_dict()), 201


@deposits_bp.delete("/deposits/<int:deposit_id>")
@jwt_required()
def delete_deposit(deposit_id):
    user_id = get_jwt_identity()
    deposit = (
        Deposit.query.join(Goal)
        .filter(Deposit.id == deposit_id, Goal.user_id == user_id)
        .first()
    )
    if not deposit:
        return jsonify({"error": "deposit not found"}), 404
    db.session.delete(deposit)
    db.session.commit()
    return "", 204
