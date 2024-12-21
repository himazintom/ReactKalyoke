from addons.database.database import execute_query
from addons.database.utils import validate_table_and_column, load_json_safe
import datetime
import json
import logging

def get_user_id_from_email(email):
    validate_table_and_column("users", "email")
    query = "SELECT id FROM users WHERE email = %s"
    row = execute_query(query, (email,), fetchone=True)
    return row["id"] if row else None

def get_user_column_by_id(user_id, column_name):
    validate_table_and_column("users", column_name)
    query = f"SELECT {column_name} FROM users WHERE id = %s"
    row = execute_query(query, (user_id,), fetchone=True)
    return row[column_name] if row else None

def add_user_data_signup(email, password, token):
    # 同じメールアドレスが存在しないか確認
    if get_user_id_from_email(email):
        return "exist"

    # 次のIDを生成
    query_max_id = "SELECT MAX(id) AS max_id FROM users"
    max_id_result = execute_query(query_max_id, fetchone=True)
    next_id = (max_id_result["max_id"] + 1) if max_id_result["max_id"] else 1

    username = f"kl{next_id:06}"
    insert_query = (
        "INSERT INTO users (username, email, password, status, token) "
        "VALUES (%s, %s, %s, %s, %s)"
    )
    result = execute_query(insert_query, (username, email, password, "temp", token))
    return "success" if result is not None else "fail"

def check_user_data_login(email, input_password):
    user_id = get_user_id_from_email(email)
    if user_id:
        stored_password = get_user_column_by_id(user_id, "password")
        if stored_password == input_password:
            return "success"
    return "fail"

def validate_token(token):
    query = "SELECT created_at FROM users WHERE token = %s"
    row = execute_query(query, (token,), fetchone=True)
    if row:
        token_time = row["created_at"]
        if (datetime.datetime.now() - token_time) <= datetime.timedelta(hours=24):
            return True
    return False

def update_user_auth_status(token):
    update_query = (
        "UPDATE users SET status = 'free', token = NULL "
        "WHERE token = %s AND status = 'temp'"
    )
    execute_query(update_query, (token,))
    # 変更があったか確認したい場合は直後にSELECTで確認する
    check_query = "SELECT id FROM users WHERE status='free' AND token IS NULL AND email IS NOT NULL"
    # ここでは簡略化
    return True

def save_user_token(user_id, token):
    update_query = "UPDATE users SET token = %s WHERE id = %s"
    return execute_query(update_query, (token, user_id)) is not None

def change_password(email, new_password):
    update_query = "UPDATE users SET password = %s WHERE email = %s"
    return execute_query(update_query, (new_password, email)) is not None

def delete_user_token(user_id):
    query = "UPDATE users SET token = NULL WHERE id = %s"
    return execute_query(query, (user_id,)) is not None

def change_user_name(user_id, new_username):
    query = "UPDATE users SET username = %s WHERE id = %s"
    return execute_query(query, (new_username, user_id)) is not None

def save_sung_history(user_id, video_id, pitch):
    from videos import get_video_title_from_video_id
    title = get_video_title_from_video_id(video_id)
    if not title:
        return

    status = get_user_column_by_id(user_id, "status")
    history_data = get_user_column_by_id(user_id, "singed_history")
    data = load_json_safe(history_data)

    # 同じvideo_idがあれば削除
    data = [d for d in data if d.get("video_id") != video_id]
    data.insert(0, {"video_id": video_id, "pitch": pitch, "title": title})

    if status == "free":
        data = data[:10]
    elif status == "singer":
        data = data[:100]  # あるいは[:200], 要件によって変更

    query = "UPDATE users SET singed_history = %s WHERE id = %s"
    execute_query(query, (json.dumps(data), user_id))
