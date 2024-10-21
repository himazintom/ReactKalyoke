from flask import Flask, jsonify, request
# from Addons import demucs_route
import Addons.DEMUCS.KalyokeDatabase as KDB
import Addons.DEMUCS.Demucs as ADD
import Addons.DEMUCS.youtubeDL as YDL
import Addons.DEMUCS.GetLyricBySites as GLBS
# from flask_cors import CORS
import datetime
from re import match


app = Flask(__name__)
# demucs_route.init(app)
# CORS(app)  # すべてのオリジンからのリクエストを許可

output_dir="/musics"

def remove_list_in_url(url):
    index=url.find("&list")
    if index==-1:
        url_non_list=url
    else:
        url_non_list=url[:index]
    return url_non_list


@app.route('/api/check_video_exist', methods=['POST'])
def checkVideoExist():
    data = request.get_json()
    videoid = data.get("videoid")
    id = KDB.get_id_from_database('videos', 'videoid', videoid)
    check = True if id else False
    return jsonify({'exist': check})

@app.route('/api/demucs', methods=['POST'])
def demucs():
    try:
        # JSON データを取得
        data = request.get_json()
        url = data.get("url")
        videoid = data.get("videoid")
        lyric = data.get("lyric")

        url_non_list = remove_list_in_url(url)
        path = ""

        id = KDB.get_id_from_database("videos", "videoid", videoid)
        if id is None:  # 曲がデータベースに存在しない場合
            temp_movie_datas = ADD.make_kalyoke(url_non_list, output_dir)

            if temp_movie_datas is None:
                return jsonify({"error": "Failed to process video data"}), 500

            save_video_datas = {
                "videoid": temp_movie_datas.get("id"),
                "title": temp_movie_datas.get("title"),
                "site": temp_movie_datas.get("extractor"),
                "lyric": lyric,
                "folder_path": temp_movie_datas.get("folder_path"),
                "register_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "update_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            path = save_video_datas["folder_path"]
            video_title = save_video_datas["title"]

            KDB.add_to_videos_database(save_video_datas)

        else:  # 曲がデータベースに存在する場合、歌詞を更新する
            KDB.update_videos_database(videoid, lyric)
            path = KDB.get_data_from_database("videos", id, "folder_path")
            video_title = KDB.get_data_from_database("videos", id, "title")

        history_datas = KDB.get_latest_videoids()
        datas = {
            "path": path,
            "history": history_datas,
            "title": video_title
        }
        # 正常なレスポンスを返す
        return jsonify(datas)

    except Exception as e:
        # エラーが発生した場合、エラーメッセージを返す
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_lyric', methods=['POST'])
def update_lyric():
    data = request.get_json()
    videoid = data.get("videoid")
    lyric = data.get("lyric")
    id = KDB.get_id_from_database("videos", "videoid", videoid)
    if id is None:  # もし入力された曲がデータベースに無い場合
        return jsonify({"error": "Video not found"}), 404
    else:  # 曲が存在する場合、歌詞を更新する
        KDB.update_videos_database(videoid, lyric)
        return jsonify({"status": "success"}), 200
    
@app.route('/api/search_videoid/<videoid>')
def search_videoid(videoid):
    videoid = videoid.replace(" ", "").replace("　", "")
    
    # YouTube動画IDの形式チェック
    pattern = r"^[a-zA-Z0-9-_]{11}$"
    if not match(pattern, videoid):
        return jsonify({"error": "Invalid video ID format"}), 400
    
    datas = {
        "videoid": videoid,
        "lyric": "",
    }
    
    id = KDB.get_id_from_database("videos", "videoid", videoid)
    if id:  # データベースにそのvideoIDが存在したら歌詞を返す
        lyric = KDB.get_data_from_database('videos', id, 'lyric')
        datas["lyric"] = lyric
    
    return jsonify(datas)

@app.route('/api/fetch_lyric', methods=['POST'])
def fetchLyric():
    data = request.get_json()
    videoid = data.get("videoid")
    id=KDB.get_id_from_database("videos", "videoid", videoid)
    if id is not None:
        return KDB.get_data_from_database("videos", id, "lyric")
    return "Null"

@app.route('/api/fetch_title', methods=['POST'])
def fetchTitle():
    data = request.get_json()
    videoid = data.get("videoid")
    id=KDB.get_id_from_database("videos", "videoid", videoid)
    if id is not None:#DBにデータがあったら
        return KDB.get_data_from_database("videos", id, "title")
    
    #DBにデータが無かったら
    url='https://www.youtube.com/watch?v='+videoid 
    title=YDL.get_video_title(url)#ytdlpを用いてtitle取得
    if title:
        return title
    return "Null"

@app.route('/api/fetch_everyone_history', methods=['POST'])
def fetchEveryoneHistory():
    history_datas = KDB.get_latest_videoids()
    return history_datas

@app.route('/api/fetch_random_music/<requestCount>', methods=['GET'])
def fetchRandomMusic(requestCount):
    music_datas=KDB.get_random_song(requestCount=requestCount)
    return music_datas

@app.route('/api/get_lyric_from_sites', methods=['POST'])
def getLyricFromSites():
    data = request.get_json()
    urls = data.get("urls")
    print('urls',urls)
    sorted_urls = GLBS.sort_urls_by_domain_priority(urls)
    print('sorted_urls',sorted_urls)
    lyric = ""
    for url in sorted_urls:
        if GLBS.check_domain(url):
            lyric = GLBS.get_lyric(url)
            if lyric:  # 空文字列ではない場合に処理を終了
                break
    return jsonify({'lyric': lyric})

@app.route('/api/fetch_playlist_datas', methods=['POST'])
def fetchPlaylistDatas():
    data = request.get_json()
    url = data.get("url")
    playlist_datas = YDL.get_playlist_video_info(url)
    # print("playlist",playlist_datas)

    return playlist_datas

@app.route('/api/fetch_video_datas_by_str', methods=['POST'])
def fetchVideoDatasByStr(): #キーワードをもとにDBからビデオデータを検索
    data = request.get_json()
    search_word = data.get("searchWord")
    video_datas = YDL.get_videoid_from_title_str(search_word)
    return video_datas


# if __name__ == '__main__':　#uwsgiで動作させるときにはいらない
#     app.run(host="0.0.0.0", port=5000)