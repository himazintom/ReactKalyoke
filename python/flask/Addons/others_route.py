from flask import render_template, request, jsonify, session
import app.DEMUCS.KalyokeDatabase as KD
import app.DEMUCS.LyricGet as LG
import os
import requests
import torch

def init_app(app):
    @app.errorhandler(404)
    def page_not_found(e):
        # ここで指定したテンプレートにリダイレクトします。
        error_json={
            'text': 'There is no api'
        }
    
    @app.route('/specified_commercial', methods=['GET'])
    def specified_commercial():
        return render_template('specified_commercial.html')

    @app.route('/debug_print', methods=['POST'])
    def debug_print():
        print(request.form["text"])
        return 'Debug print received'
    
    @app.route('/youtube_random_select', methods=['POST'])
    def youtube_random_select():
        datas = KD.get_random_song()
        return datas
    
    @app.route('/get_lyric_from_url', methods=['POST'])
    def get_lyric_from_url():
        url=request.form["url"]
        if LG.check_domain(url):
            return LG.get_lyrics(url)
        return 'fail'

    @app.route('/get_image_count', methods=['GET'])
    def get_image_count():
        image_folder_path = 'app/static/pictures/title_schemeless/256x256png/'  # 画像が保存されているフォルダのパス
        image_count = len([name for name in os.listdir(image_folder_path) if os.path.isfile(os.path.join(image_folder_path, name))])
        return jsonify({'image_count': image_count})
    
    @app.route('/how_to_use')
    def how_to_use():
        return render_template('how_to_use.html')
    
    @app.route('/lyric_copy')
    def lyric_copy():
        return render_template('lyric_copy.html')
    
    @app.route('/search_by_youtube_data', methods=['POST'])
    def search_by_youtube_data():
        search_word = request.form['search_word']
        # YouTube Data APIの検索エンドポイント
        url = 'https://www.googleapis.com/youtube/v3/search'
        params = {
            'part': 'snippet',
            'q': search_word,
            'maxResults': 5,
            'type': 'video',
            'key': 'AIzaSyBcrvZOrXHFXYl4mdO2ES8sQodCGoYHupM'  # ここにYouTube Data APIのキーを設定
        }
        response = requests.get(url, params=params).json()
        
        # レスポンスにエラーが含まれているか、itemsキーが存在しない場合のエラーハンドリング
        if 'error' in response or 'items' not in response:
            error_message = response.get('error', {}).get('message', '不明なエラーが発生しました。')
            return jsonify({'error': True, 'message': error_message})
        
        # 検索結果のタイトルとビデオIDをリストで返す
        results = [{'title': item['snippet']['title'], 'url': f"{os.getenv('APP_DOMAIN')}/search_id/{item['id']['videoId']}"} for item in response['items']]
        return jsonify({'results': results})
    
    @app.route('/gpu_available_check')
    def gpu_available_check():
        return "A: " + str(torch.cuda.is_available())
    
    # @app.route('/select_plan')
    # def select_plan():
    #     datas = {"APP_DOMAIN": os.getenv('APP_DOMAIN')}
    #     return render_template('select_plan.html', datas=datas)
    
    # @app.route('/privacy_policy')
    # def privacy_policy():
    #     return render_template('privacy_policy.html')
    
    # @app.route('/terms_of_service')
    # def terms_of_service():
    #     return render_template('terms_of_service.html')
