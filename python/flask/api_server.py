from flask import Flask, jsonify, request

import addons.kalyoke_database as kalyoke_db
import addons.demucs as demucs
import addons.youtube_dl as youtube_dl
import addons.search_lyric as search_lyric

import datetime
from re import match


app = Flask(__name__)

output_dir = "/musics"

def remove_list_in_url(url):
    index = url.find("&list")
    if index == -1:
        url_non_list = url
    else:
        url_non_list = url[:index]
    return url_non_list


@app.route("/api/check_video_exist", methods=["POST"])
def check_video_exist():
    data = request.get_json()
    video_id = data.get("videoId")
    id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
    check = True if id else False
    return jsonify({"exist": check})


@app.route("/api/separate_music", methods=["POST"])
def separate_music():
    try:
        # JSON データを取得
        data = request.get_json()
        url = data.get("url")
        video_id = data.get("videoId")
        lyric = data.get("lyric")

        url_non_list = remove_list_in_url(url)
        path = ""
        
        id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
        if id is None:  # 曲がデータベースに存在しない場合
            temp_movie_data = demucs.make_kalyoke(url_non_list, output_dir)

            if temp_movie_data is None:
                return jsonify({"error": "Failed to process video data"}), 500

            save_video_data = {
                "video_id": temp_movie_data.get("id"),
                "title": temp_movie_data.get("title"),
                "site": temp_movie_data.get("extractor"),
                "lyric": lyric,
                "folder_path": temp_movie_data.get("folder_path"),
                "register_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "update_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            print("save_video_data",save_video_data)
            path = save_video_data["folder_path"]
            video_title = save_video_data["title"]

            kalyoke_db.add_to_videos_database(save_video_data)

        else:  # 曲がデータベースに存在する場合、歌詞を更新する
            kalyoke_db.update_videos_database(video_id, lyric)
            path = kalyoke_db.get_data_from_database("videos", id, "folder_path")
            video_title = kalyoke_db.get_data_from_database("videos", id, "title")

        history_data = kalyoke_db.get_latest_video_ids()
        data = {"path": path, "history": history_data, "title": video_title}
        # 正常なレスポンスを返す
        return jsonify(data)

    except Exception as e:
        # エラーが発生した場合、エラーメッセージを返す
        return jsonify({"error": str(e)}), 500


@app.route("/api/update_lyric", methods=["POST"])
def update_lyric():
    data = request.get_json()
    video_id = data.get("videoId")
    lyric = data.get("lyric")
    id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
    if id is None:  # もし入力された曲がデータベースに無い場合
        return jsonify({"error": "Video not found"}), 404
    else:  # 曲が存在する場合、歌詞を更新する
        kalyoke_db.update_videos_database(video_id, lyric)
        return jsonify({"status": "success"}), 200


@app.route("/api/search_video_id/<video_id>")
def search_video_id(video_id):
    video_id = video_id.replace(" ", "").replace("　", "")

    # YouTube動画IDの形式チェック
    pattern = r"^[a-zA-Z0-9-_]{11}$"
    if not match(pattern, video_id):
        return jsonify({"error": "Invalid video ID format"}), 400

    data = {
        "videoId": video_id,
        "lyric": "",
    }

    print("data", data)
    id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
    if id:  # データベースにそのvideoIDが存在したら歌詞を返す
        lyric = kalyoke_db.get_data_from_database("videos", id, "lyric")
        data["lyric"] = lyric

    return jsonify(data)


@app.route("/api/fetch_lyric", methods=["POST"])
def fetch_lyric():
    data = request.get_json()
    video_id = data.get("videoId")
    id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
    if id is not None:
        return kalyoke_db.get_data_from_database("videos", id, "lyric")
    return "Null"


@app.route("/api/fetch_title", methods=["POST"])
def fetch_title():
    data = request.get_json()
    video_id = data.get("videoId")
    id = kalyoke_db.get_id_from_database("videos", "video_id", video_id)
    if id is not None:  # DBにデータがあったら
        return kalyoke_db.get_data_from_database("videos", id, "title")

    # DBにデータが無かったら
    url = "https://www.youtube.com/watch?v=" + video_id
    title = youtube_dl.get_video_title(url)  # ytdlpを用いてtitle取得
    if title:
        return title
    return "Null"


# DBをもとに、最近うたわれた5曲を取得
@app.route("/api/fetch_everyone_history", methods=["POST"])
def fetch_everyone_history():
    history_data = kalyoke_db.get_latest_video_ids()
    return history_data


@app.route("/api/fetch_random_music/<requestCount>", methods=["GET"])
def fetch_random_music(requestCount):
    random_music_data = kalyoke_db.get_random_song(requestCount=requestCount)
    return random_music_data


@app.route("/api/get_lyric_from_sites", methods=["POST"])
def get_lyric_from_sites():
    data = request.get_json()
    urls = data.get("urls")
    sorted_urls = search_lyric.sort_urls_by_domain_priority(urls)
    lyric = ""
    for url in sorted_urls:
        if search_lyric.check_domain(url):
            lyric = search_lyric.get_lyric(url)
            if lyric:  # 空文字列ではない場合に処理を終了
                break
    return jsonify({"lyric": lyric})


@app.route("/api/fetch_playlist_data", methods=["POST"])
def fetch_playlist_data():
    data = request.get_json()
    url = data.get("url")
    playlist_data = youtube_dl.get_playlist_video_info(url)

    return playlist_data


@app.route("/api/fetch_video_data_by_str", methods=["POST"])
def fetch_video_data_by_str():  # キーワードをもとにDBからビデオデータを検索
    data = request.get_json()
    search_word = data.get("searchWord")
    video_data = kalyoke_db.get_video_id_from_title_str(search_word)
    
    # video_idをvideoIdに変換
    for video in video_data:
        video["videoId"] = video.pop("video_id")  # video_idをvideoIdに変更
    
    return video_data

# if __name__ == '__main__':　#uwsgiで動作させるときにはいらない
#     app.run(host="0.0.0.0", port=5000)
