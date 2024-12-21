from addons.database.database import execute_query
from addons.database.utils import validate_table_and_column
import datetime

def exists_video_id(video_id):
    id = get_id_from_videos_video_id(video_id)
    return id is not None

def get_id_from_videos_video_id(video_id):
    validate_table_and_column("videos", "video_id")
    query = "SELECT id FROM videos WHERE video_id = %s"
    row = execute_query(query, (video_id,), fetchone=True, dictionary=True)
    return row["id"] if row else None

def get_video_folder_path_from_video_id(video_id):
    validate_table_and_column("videos", "folder_path")
    query = "SELECT folder_path FROM videos WHERE video_id = %s"
    row = execute_query(query, (video_id,), fetchone=True, dictionary=True)
    return row["folder_path"] if row else None

def get_video_title_from_video_id(video_id):
    validate_table_and_column("videos", "video_id")
    query = "SELECT title FROM videos WHERE video_id = %s"
    row = execute_query(query, (video_id,), fetchone=True, dictionary=True)
    return row["title"] if row else None

def get_video_lyric_from_video_id(video_id):
    validate_table_and_column("videos", "video_id")
    query = "SELECT lyric FROM videos WHERE video_id = %s"
    row = execute_query(query, (video_id,), fetchone=True, dictionary=True)
    return row["lyric"] if row else None

def get_video_lyric_update_date_from_video_id(video_id):
    validate_table_and_column("videos", "video_id")
    query = "SELECT lyric_update_date FROM videos WHERE video_id = %s"
    row = execute_query(query, (video_id,), fetchone=True, dictionary=True)
    return row["lyric_update_date"] if row else None

def update_video_lyric_update_date_from_video_id(video_id):
    validate_table_and_column("videos", "video_id")
    print("yeah")

    query_update = "UPDATE videos SET lyric_update_date = NOW() WHERE video_id = %s"
    execute_query(query_update, (video_id,))

def add_to_videos_database(data):
    add_video = (
        "INSERT INTO videos (site, video_id, title, lyric, lyric_update_date folder_path, register_date, update_date) "
        "VALUES (%(site)s, %(video_id)s, %(title)s, %(lyric)s, %(lyric_update_date)s, %(folder_path)s, %(register_date)s, %(update_date)s) "
        "ON DUPLICATE KEY UPDATE "
        "title = VALUES(title), lyric = VALUES(lyric), folder_path = VALUES(folder_path), update_date = VALUES(update_date)"
    )
    return execute_query(add_video, data) is not None

def update_videos_database(video_id, lyric):
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if lyric is not None:
        update_video = "UPDATE videos SET update_date = %s, lyric = %s WHERE video_id = %s"
        execute_query(update_video, (current_time, lyric, video_id))
    else:
        update_video = "UPDATE videos SET update_date = %s WHERE video_id = %s"
        execute_query(update_video, (current_time, video_id))

def get_latest_video_ids(limit=5):
    query = "SELECT video_id, title FROM videos ORDER BY update_date DESC LIMIT %s"
    return execute_query(query, (limit,), fetchall=True, dictionary=True) or []

def get_video_id_from_title_str(search_word):
    query = "SELECT video_id, title FROM videos WHERE title LIKE %s"
    rows = execute_query(query, ("%" + search_word + "%",), fetchall=True, dictionary=True)
    return rows or []

def get_random_song(requestCount):
    query = "SELECT video_id, lyric, title FROM videos ORDER BY RAND() LIMIT %s"
    rows = execute_query(query, (int(requestCount),), fetchall=True, dictionary=True)
    return rows or []
