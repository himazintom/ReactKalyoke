import json

ALLOWED_TABLES = {
    "videos": [
        "id", "site", "video_id", "title", "lyric", "folder_path", "register_date", "update_date"
    ],
    "users": [
        "id", "username", "email", "password", "status", "token", "singed_history", "created_at"
    ]
}

def validate_table_and_column(table, column_name):
    if table not in ALLOWED_TABLES:
        raise ValueError("無効なテーブル名です。")
    if column_name != "*" and column_name not in ALLOWED_TABLES[table]:
        raise ValueError("無効なカラム名です。")

def load_json_safe(data):
    try:
        return json.loads(data)
    except (TypeError, ValueError):
        return []
