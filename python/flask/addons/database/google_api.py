from addons.database.database import execute_query
import datetime

def google_search_api_count():
    try:
        # 今日の日付を取得
        today = datetime.date.today()

        # 使用回数を取得するクエリ
        query = """
        SELECT usage_count FROM api_usage_log
        WHERE date = %s AND endpoint = 'google_api'
        """
        row = execute_query(query, (today,), fetchone=True, dictionary=True)
        # 使用回数を加算するクエリ
        if not row:
            # レコードが存在しない場合、新しいレコードを挿入
            insert_query = """
            INSERT INTO api_usage_log (date, reset_time, endpoint, usage_count)
            VALUES (%s, '17:00:00', 'google_api', 1)
            """
            execute_query(insert_query, (today,))
            usage_count = 1
        else:
            # 既存のレコードが存在する場合、使用回数を加算
            update_query = """
            UPDATE api_usage_log
            SET usage_count = usage_count + 1
            WHERE date = %s AND endpoint = 'google_api'
            """
            execute_query(update_query, (today,))
            usage_count = row['usage_count'] + 1
        return usage_count

    except Exception as e:
        print(f"Error getting or updating Google API count: {e}")
        return None