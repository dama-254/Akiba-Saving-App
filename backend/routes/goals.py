from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Goal

goals_bp = Blueprint("goals", __name__, url_prefix="/api/goals")


def _parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


@goals_bp.get("")
@jwt_required()
def list_goals():
    user_id = get_jwt_identity()
    goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
    return jsonify([g.to_dict() for g in goals]), 200


@goals_bp.post("")
@jwt_required()
def create_goal():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    target_amount = data.get("target_amount")

    if not title:
        return jsonify({"error": "title is required"}), 400
    try:
        target_amount = float(target_amount)
        if target_amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "target_amount must be a positive number"}), 400

    try:
        deadline = _parse_date(data.get("deadline"))
    except ValueError:
        return jsonify({"error": "deadline must be YYYY-MM-DD"}), 400

    goal = Goal(user_id=user_id, title=title, target_amount=target_amount, deadline=deadline)
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201


def _get_owned_goal(goal_id, user_id):
    return Goal.query.filter_by(id=goal_id, user_id=user_id).first()


@goals_bp.get("/<int:goal_id>")
@jwt_required()
def get_goal(goal_id):
    user_id = get_jwt_identity()
    goal = _get_owned_goal(goal_id, user_id)
    if not goal:
        return jsonify({"error": "goal not found"}), 404
    payload = goal.to_dict()
    payload["deposits"] = [d.to_dict() for d in sorted(goal.deposits, key=lambda d: d.created_at, reverse=True)]
    return jsonify(payload), 200


@goals_bp.put("/<int:goal_id>")
@jwt_required()
def update_goal(goal_id):
    user_id = get_jwt_identity()
    goal = _get_owned_goal(goal_id, user_id)
    if not goal:
        return jsonify({"error": "goal not found"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        goal.title = title
    if "target_amount" in data:
        try:
            target_amount = float(data.get("target_amount"))
            if target_amount <= 0:
                raise ValueError
            goal.target_amount = target_amount
        except (TypeError, ValueError):
            return jsonify({"error": "target_amount must be a positive number"}), 400
    if "deadline" in data:
        try:
            goal.deadline = _parse_date(data.get("deadline"))
        except ValueError:
            return jsonify({"error": "deadline must be YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify(goal.to_dict()), 200


@goals_bp.delete("/<int:goal_id>")
@jwt_required()
def delete_goal(goal_id):
    user_id = get_jwt_identity()
    goal = _get_owned_goal(goal_id, user_id)
    if not goal:
        return jsonify({"error": "goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return "", 204
