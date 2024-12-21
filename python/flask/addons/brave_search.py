import requests
import os

brave_token = os.getenv("BRAVE_TOKEN")

def get_lyric_sites(video_title, language):
    url = "https://api.search.brave.com/res/v1/web/search"
    languages = {"ja": "歌詞", "en": "Lyric"}
    querystring = {
        "q": f"{video_title} {language}",
        "count": 5,
        "result_filter": "web",
    }
    headers = {"x-subscription-token": brave_token}
    response = requests.request("GET", url, headers=headers, params=querystring)
    response_data = response.json()
    sites = response_data["web"]["results"]
    urls = [site["url"] for site in sites]  # URLをリストに抽出
    return urls  # URLのリストを返す
