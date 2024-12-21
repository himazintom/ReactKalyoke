import mysql.connector
import os
import logging
from contextlib import contextmanager

# 環境変数からDB接続情報を取得
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

@contextmanager
def get_connection():
    """
    DB接続をコンテキストマネージャで管理
    """
    conn = None
    try:
        conn = mysql.connector.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            database=DB_NAME,
            charset="utf8mb4",
            collation="utf8mb4_general_ci",
        )
        yield conn
    except mysql.connector.Error as err:
        logging.error(f"Database connection error: {err}")
        raise
    finally:
        if conn is not None and conn.is_connected():
            conn.close()


def execute_query(query, params=None, fetchone=False, fetchall=False, dictionary=False):
    """
    汎用的なクエリ実行関数。
    fetchone=Trueで1行取得
    fetchall=Trueで全行取得
    dictionary=Trueでdictionary=Trueカーソル
    """
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=dictionary)
        try:
            cursor.execute(query, params or ())
            if fetchone:
                result = cursor.fetchone()
            elif fetchall:
                result = cursor.fetchall()
            else:
                result = None
            conn.commit()
            return result
        except mysql.connector.Error as err:
            logging.error(f"Database error: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
