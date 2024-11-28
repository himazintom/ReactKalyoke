import mysql.connector
import json
import datetime
import os

host_aa = os.getenv("DB_HOST")
data_base = os.getenv("DB_NAME")
user_aa = os.getenv("DB_USER")
password_aa = os.getenv("DB_PASSWORD")


def connect_to_database():
    return mysql.connector.connect(
        user=user_aa,
        password=password_aa,
        host=host_aa,
        database=data_base,
        charset="utf8mb4",
        collation="utf8mb4_general_ci",
    )


def close_database_connection(cursor, conn):
    """データベース接続を終了する"""
    if cursor is not None:
        cursor.close()  # カーソルを先に閉じる
    if conn is not None:
        try:
            conn.commit()  # または conn.rollback() を使用してトランザクションを終了
        except mysql.connector.Error as err:
            print(f"The error in transaction: {err}")
        conn.close()  # コネクションを最後に閉じる


def get_id_from_database(table, column_name, value):
    # テーブル名のチェックを追加
    if table not in ["videos", "users"]:
        raise ValueError("無効なテーブル名です。")
    if table == "videos":
        if column_name not in [
            "site",
            "video_id",
            "title",
            "lyric",
            "folder_path",
            "register_date",
            "update_date",
        ]:
            raise ValueError("無効なカラム名です。")
    if table == "users":
        if column_name not in [
            "username",
            "email",
            "password",
            "status",
            "token",
            "history",
            "created_at",
        ]:
            raise ValueError("無効なカラム名です。")

    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        query = f"SELECT id FROM {table} WHERE {column_name} = %s"
        cursor.execute(query, (value,))
        row = cursor.fetchone()  # 最初の行を取得

        # 追加の未処理の結果セットがあるか確認し、それを破棄する
        while cursor.nextset():
            cursor.fetchall()

        return row[0] if row else None

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return None

    finally:
        close_database_connection(cursor, conn)


def get_data_from_database(table, id, column_name):
    print("status", table, id, column_name)

    # テーブル名のチェックを追加
    if table not in ["videos", "users"]:
        raise ValueError("無効なテーブル名です。")
    if table == "videos" and column_name not in [
        "site",
        "video_id",
        "title",
        "lyric",
        "folder_path",
        "register_date",
        "update_date",
        "*",
    ]:
        raise ValueError("無効なカラム名です。")
    if table == "users" and column_name not in [
        "username",
        "email",
        "password",
        "status",
        "token",
        "singed_history",
        "created_at",
        "*",
    ]:
        raise ValueError("無効なカラム名です。")

    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        query = f"SELECT {column_name} FROM {table} WHERE id = %s"
        cursor.execute(query, (id,))
        row = cursor.fetchone()
        # 残りの結果セットがないか確認し、あれば破棄する
        while cursor.nextset():
            cursor.fetchall()  # 残りの結果セットを破棄

        return row[0] if row else None
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return None
    finally:
        close_database_connection(cursor, conn)


def add_to_videos_database(data):  # videosデータベースに曲情報を追加
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        add_video = (
            "INSERT INTO videos "
            "(site, video_id, title, lyric, folder_path, register_date, update_date) "
            "VALUES (%(site)s, %(video_id)s, %(title)s, %(lyric)s, %(folder_path)s, "
            "%(register_date)s, %(update_date)s)"
        )
        cursor.execute(add_video, data)
        conn.commit()
    except Exception as e:
        print(f"Error occurred: {e}")  # エラーメッセージを表示
    finally:
        close_database_connection(cursor, conn)  # 確実に接続を閉じる


def update_videos_database(video_id, lyric):  # videosデータベースの歌われた情報を更新
    conn = connect_to_database()
    cursor = conn.cursor()
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if lyric is not None:
        update_video = (
            "UPDATE videos SET update_date = %s, lyric = %s WHERE video_id = %s"
        )
        cursor.execute(update_video, (current_time, lyric, video_id))
    else:
        update_video = "UPDATE videos SET update_date = %s WHERE video_id = %s"
        cursor.execute(update_video, (current_time, video_id))
    conn.commit()
    close_database_connection(cursor, conn)


def get_latest_video_ids():  # 最近うたわれた順で5曲を取得
    conn = connect_to_database()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT video_id, title FROM videos ORDER BY update_date DESC LIMIT 5"
    cursor.execute(query)
    rows = cursor.fetchall()
    close_database_connection(cursor, conn)
    return rows


def get_video_id_from_title_str(search_word):
    try:
        conn = connect_to_database()
        with conn.cursor(dictionary=True) as cursor:
            # 検索キーワードの前後に%を追加して部分一致検索
            query = "SELECT video_id, title FROM videos WHERE title LIKE %s"
            cursor.execute(query, ("%" + search_word + "%",))
            rows = cursor.fetchall()
        conn.close()  # リソース管理としては、with構文でconnも自動管理できるとよいが、cursorのみ対応
        if rows:
            return rows
        else:
            return []  # 見つからなかった場合は空リストを返す
    except Exception as e:
        # ログを取るなど、エラーハンドリング
        print(f"Error occurred: {e}")
        return []

def add_user_data_signup(email, password, token):  # 新しくユーザー情報を登録する
    result = get_id_from_database("users", "email", email)
    if (
        result
    ):  # もし、htmlで無理やり存在するメルアドで新規登録を仕掛けようとしてたら...
        return "exist"  #
    try:
        conn = connect_to_database()
        cursor = conn.cursor()

        # ユーザーIDを生成するために最新のIDを取得
        cursor.execute("SELECT MAX(id) FROM users")
        max_id_result = cursor.fetchone()
        next_id = (
            max_id_result[0] + 1 if max_id_result[0] else 1
        )  # 最大IDがNoneでなければ+1、Noneなら1を設定

        # ユーザー名を生成（例: "kl000043"）
        username = f"kl{next_id:06}"  # nextidの左側を6桁になるまで0で埋める

        # クエリを複数行に分割して行の長さを短くする
        add_user_query = (
            "INSERT INTO users (username, email, password, status, token) "
            "VALUES (%s, %s, %s, %s, %s)"
        )
        cursor.execute(add_user_query, (username, email, password, "temp", token))
        conn.commit()  # データベースに変更をコミット
    except mysql.connector.Error as err:
        print(f"データベース操作中にエラーが発生しました: {err}")
        return "fail"
    finally:
        close_database_connection(cursor, conn)
    return "success"


# アドレスとパスワードがあっているか確認
def check_user_data_login(email, input_password):
    user_id = get_id_from_database("users", "email", email)
    if user_id:  # もしデータベースにアドレスがあって
        result = get_data_from_database("users", user_id, "password")
        if result == input_password:
            return "success"  # パスワードが一致する場合
        return "fail"  # パスワードが一致しない
    return "fail"  # アドレスが存在しない場合


def validate_token(
    token,
):  # tokenの期限が過ぎていないか、またdbに一致するものがあるかを調べる
    conn = connect_to_database()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT created_at FROM users WHERE token = %s"
    cursor.execute(query, (token,))
    row = cursor.fetchone()
    close_database_connection(cursor, conn)

    if row:
        token_time = row["created_at"]
        current_time = datetime.datetime.now()
        if (current_time - token_time) <= datetime.timedelta(hours=24):
            return True
    return False


def update_user_auth_status(
    token,
):  # ユーザーのステータスをtempからfreeにい昇格してよいか
    conn = connect_to_database()
    cursor = conn.cursor()
    # トークンに該当するユーザーのstatusを"temp"から"Free"に更新し、トークンを削除するクエリ
    update_query = (
        "UPDATE users SET status = 'free', token = NULL "
        "WHERE token = %s AND status = 'temp'"
    )
    cursor.execute(update_query, (token,))
    affected_rows = cursor.rowcount  # 更新された行数を取得
    conn.commit()
    close_database_connection(cursor, conn)
    return affected_rows > 0  # 1行以上更新された場合はTrue、そうでなければFalseを返す


def save_user_token(user_id, token):  # ユーザーのトークンを保存する
    conn = connect_to_database()
    cursor = conn.cursor()
    update_query = "UPDATE users SET token = %s WHERE id = %s"
    cursor.execute(update_query, (token, user_id))
    conn.commit()
    close_database_connection(cursor, conn)


def change_password(email, new_password):  # ユーザーのパスワードの変更
    conn = connect_to_database()
    cursor = conn.cursor()
    # パスワードを更新するクエリに変更
    update_query = "UPDATE users SET password = %s WHERE email = %s"
    cursor.execute(update_query, (new_password, email))
    conn.commit()  # データベースに変更をコミット
    close_database_connection(cursor, conn)


def delete_user_token(id):  # ユーザーのトークンを削除する
    conn = connect_to_database()
    cursor = conn.cursor()
    query = "UPDATE users SET token = NULL WHERE id = %s"
    cursor.execute(query, (id,))
    conn.commit()
    close_database_connection(cursor, conn)


def change_user_name(user_id, new_username):  # ユーザーの名前を変更する
    conn = connect_to_database()
    cursor = conn.cursor()
    query = "UPDATE users SET username = %s WHERE id = %s"
    cursor.execute(query, (new_username, user_id))
    conn.commit()
    close_database_connection(cursor, conn)


def save_singed_history(user_id, video_id, pitch):  # ユーザーの歌った履歴を保存する
    id = get_id_from_database("videos", "video_id", video_id)
    if id:
        title = get_data_from_database("videos", id, "title")
        status = get_data_from_database("users", user_id, "status")
        add_data = {"video_id": video_id, "pitch": pitch, "title": title}
        data = get_data_from_database("users", user_id, "singed_history")
        if data:
            data = json.loads(data)
            # 同じvideo_idの曲があるかチェックし、あれば削除
            data = [data for data in data if data["video_id"] != video_id]
            # 新しいデータを先頭に追加
            data.insert(0, add_data)
            if status == "free":
                data = data[:10]
            if status == "singer":
                data = data[:100]
            if status == "singer":
                data = data[:200]
        else:
            data = [add_data]
        conn = connect_to_database()
        cursor = conn.cursor()
        query = "UPDATE users SET singed_history = %s WHERE id = %s"
        cursor.execute(query, (json.dumps(data), user_id))
        conn.commit()
        close_database_connection(cursor, conn)


def get_random_song(requestCount):
    try:
        conn = connect_to_database()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT video_id, lyric, title FROM videos ORDER BY RAND() LIMIT %s"
        cursor.execute(
            query, (int(requestCount),)
        )  # requestCountを整数に変換してからクエリに渡す
        rows = cursor.fetchall()  # fetchall()を使って全ての行を取得
        close_database_connection(cursor, conn)
        if rows:
            return rows  # 全ての行をリストで返す
        else:
            return []  # 空のリストを返す
    except Exception as e:
        print(f"Error getting random song: {e}")
        return None
