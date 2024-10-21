from flask import render_template, request, redirect, session, jsonify
import os
from re import match
import app.DEMUCS.KalyokeDatabase as KDB
import app.DEMUCS.Demucs as DD
import app.DEMUCS.PitchShifter as PS
import datetime
import app.DEMUCS.youtubeDL as ytdl
import app.DEMUCS.LyricGet as LG
import app.DEMUCS.BraveSearch as BS

output_dir="/var/www/apache-flask/app/static/output"

def init_app(app):
    @app.before_request#どのページに入る前に必ず行う関数
    def check_user_session():
        session.permanent = True
        #print("session=",session)
        if 'login_token' in session:  # セッションからログイントークンを取得
            login_token = session['login_token']
            user_id = KDB.get_id_from_database("users", "token", login_token)
            if user_id:
                session['user_id'] = user_id
                session['user_name'] = KDB.get_data_from_database("users", user_id, "username")
            else:  # dbのlogin_tokenと一致しなかったら...
                if "user_id" in session:
                    session.pop('user_id', None)
                if "user_name" in session:
                    session.pop('user_name', None)
                if "user_status" in session:
                    session.pop('user_status', None)
                if 'login_token' in session:
                    session.pop('login_token', None)

    @app.route('/')
    def home():
        if 'search_id_datas' in session:  # クッキーからセッションへ変更
            datas = session['search_id_datas']
            #print("datas=",datas)

            if "videoid" in datas:
                id=KDB.get_id_from_database("videos", "videoid", datas["videoid"])
                #print("id",id)
                lyric = KDB.get_data_from_database("videos", id, "lyric")
                #print("lyric",lyric)

                datas.update({"lyric": lyric})
        else:
            datas = {}
        history_data = KDB.get_latest_videoids()
        datas.update({"APP_DOMAIN": os.getenv('APP_DOMAIN')})
        
        datas.update({"history": history_data})
        return render_template('home.html', datas=datas)
    
    @app.route('/search_id/<videoid>')
    def search_id(videoid):
        videoid = videoid.replace(" ", "").replace("　", "")
        # YouTube動画IDの形式チェック
        pattern = r"^[a-zA-Z0-9-_]{11}$"
        if not match(pattern, videoid):
            return redirect("/")
        
        id = KDB.get_id_from_database("videos", "videoid", videoid)
        if id:#データベースにそのvideoIDは存在するか確かめる
            save_search_mocie_datas(videoid)#もしあったら歌詞も表示できるようにvideoidも情報につける
        else:#idだけ、youtubeURLFormに入力してもらう
            datas = {
                "url": "https://www.youtube.com/watch?v=" + videoid
            }
            session['search_id_datas'] = datas  # クッキーからセッションへ変更
        return redirect("/")

    def remove_list_in_url(url):
        index=url.find("&list")
        if index==-1:
            url_non_list=url
        else:
            url_non_list=url[:index]
        return url_non_list
    
    @app.route('/demucs', methods=['POST'])
    def demucs():
        url = request.form["url"]
        url_non_list = remove_list_in_url(url)
        videoid = request.form["videoid"]
        lyric = request.form["lyric"]
        inst_volume = request.form["instvolume"]
        voice_volume = request.form["voicevolume"]
        session["inst_volume"]=inst_volume
        session["voice_volume"]=voice_volume
        path=""
        id=KDB.get_id_from_database("videos", "videoid", videoid)
        if id is None:#もし入力された曲が手持ちになかったら
            status=""
            if "user_id" in session:
                user_id = session["user_id"]
                status = KDB.get_data_from_database("users", user_id, "status")
            else:
                status = "none"
            temp_movie_datas=DD.make_kalyoke(url_non_list,output_dir,status)
            if temp_movie_datas=="no data":
                return jsonify({"message":"no data"})
            if(temp_movie_datas=="time long"):
                return jsonify({"message":"time long", "status":status})
            save_video_datas={
                "videoid": temp_movie_datas["id"],
                "title": temp_movie_datas["title"],
                "site": temp_movie_datas["extractor"],
                "lyric": lyric,
                "folder_path": temp_movie_datas["folder_path"],
                "register_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "update_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            path=save_video_datas["folder_path"]
            video_title=save_video_datas["title"]
            
            KDB.add_to_videos_database(save_video_datas)
            
        else:#あるIDの曲ファイルが存在していたら歌詞のみ更新する
            KDB.update_videos_database(videoid,lyric)
            path=KDB.get_data_from_database("videos", id, "folder_path")
            video_title=KDB.get_data_from_database("videos", id, "title")

        history_datas=KDB.get_latest_videoids()
        datas={
            "path": path,
            "history": history_datas,
            "title": video_title
        }
        save_search_mocie_datas(videoid)
        return datas
    
    @app.route('/demucs_update_lyric', methods=['POST'])
    def demucs_update_lyric():
        videoid = request.form["videoid"]
        lyric = request.form["lyric"]
        id=KDB.get_id_from_database("videos", "videoid", videoid)
        if id is None:#もし入力された曲が手持ちになかったら
            return "error"
        else:#あるIDの曲ファイルが存在していたら歌詞のみ更新する
            KDB.update_videos_database(videoid,lyric)
            return "success"

    @app.route('/playlist_kalyoke')
    def playlist_kalyoke():
        if not 'user_id' in session:
            return render_template('error.html',errormessage=gettext("ログインしてからご利用いただける機能です。"))
        elif session['user_status'] in ('temp', 'free'):
            print("session['user_status']",session['user_status'])
            return render_template('error.html',errormessage=gettext("singerプランになってからご利用いただける機能です。"))
        else:#singerプラン以上だったら
            print("session['user_status']",session['user_status'])

            return render_template('playlist_kalyoke.html')

    @app.route('/demucs_playlist', methods=['POST'])
    def demucs_playlist():
        playlist_url = request.form["url"]
        videoids=ytdl.get_playlist_videoids(playlist_url)
        for videoid in videoids:
            id=KDB.get_id_from_database("videos", "videoid", videoid)
            if id is None:
                temp_movie_datas=KDB.get_data_from_database("videos", id, "*")
                url = "https://www.youtube.com/watch?v="+videoid
                temp_movie_datas=DD.make_kalyoke(url, output_dir)
                if(temp_movie_datas=="time long"):
                    continue
                tvideoid=temp_movie_datas["id"]
                lyric = auto_lyrics_by_videoid(tvideoid)
                save_video_datas={
                    "videoid": temp_movie_datas["id"],
                    "title": temp_movie_datas["title"],
                    "site": temp_movie_datas["extractor"].replace("Tab",""),
                    "lyric": lyric,
                    "folder_path": temp_movie_datas["folder_path"],
                    "register_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "update_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                KDB.add_to_videos_database(save_video_datas)
                video_data=save_video_datas
            else:#あるIDの曲ファイルが存在していたら歌詞のみ更新する
                KDB.update_videos_database(videoid,None)
        return "done"

    @app.route('/getlyric', methods=['POST'])
    def getlyric():
        videoid = request.form["videoid"]
        
        id=KDB.get_id_from_database("videos", "videoid", videoid)
        if id is not None:
            lyric=KDB.get_data_from_database("videos", id, "lyric")
            return lyric
        return "Null"
    
    @app.route('/auto_lyrics', methods=['POST'])
    def auto_lyrics():
        url = request.form["url"]
        url_non_list = remove_list_in_url(url)
        title=ytdl.get_video_title(url_non_list)
        search_language=request.form['searchLanguage']
        sites=BS.get_lyric_sites(title,search_language)
        urls=[]
        lyrics=''
        for site in sites:
            urls.append(site['url'])
        sorted_urls=LG.sort_urls_by_domain_priority(urls)
        #print("sorted=",sorted_urls)
        for url in sorted_urls:
            #print("url",url)
            if(LG.check_domain(url)):
                #print("check!\n")
                lyrics=LG.get_lyrics(url)
                if lyrics!='':
                    break
        return lyrics
    
    def auto_lyrics_by_videoid(videoid):
        url = "https://www.youtube.com/watch?v="+videoid
        url_non_list = remove_list_in_url(url)
        title=ytdl.get_video_title(url_non_list)
        language="ja"#修正の必要あり
        sites=BS.get_lyric_sites(title,language)
        urls=[]
        lyrics=''
        for site in sites:
            urls.append(site['url'])
        sorted_urls=LG.sort_urls_by_domain_priority(urls)
        #print("sorted=",sorted_urls)
        for url in sorted_urls:
            #print("url",url)
            if(LG.check_domain(url)):
                #print("check!\n")
                lyrics=LG.get_lyrics(url)
                if lyrics!='':
                    break
        return lyrics
    
    @app.route('/search_movie', methods=['POST'])
    def search_movie():
        search_name = request.form["search_name"]
        result=KDB.get_videoid_from_title_str(search_name)
        if result==[]:
            return "Null"
        return result
        
    @app.route("/pitchshift", methods=['POST'])
    def pitchshift():
        path = request.form["path"]
        pitch = request.form["pitch"]
        pitch=int(pitch)
        datas=[]
        datas.append(PS.PitchShift(f"{path}/no_vocals.mp3",pitch))
        datas.append(PS.PitchShift(f"{path}/vocals.mp3",pitch))
        return datas
    
    def save_search_mocie_datas(videoid):
        search_movie_datas = {
            "url": "https://www.youtube.com/watch?v=" + videoid,
            "videoid": videoid
        }
        session['search_id_datas']=search_movie_datas
    

