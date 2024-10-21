import requests
import json

def get_lyric_sites(video_title, mode=0):
    url = "https://api.search.brave.com/res/v1/web/search"
    languages = {'ja': '歌詞', 'en': 'Lyric'}
    querystring = {"q":f"{video_title} {languages[mode]}","count": 5, "result_filter": "web"}
    headers = {
        "x-subscription-token": "BSABM3P8qZb3Zg7VQWaPjq1QpX1vol0"
    }
    response = requests.request("GET", url, headers=headers, params=querystring)
    response_data = response.json()
    sites=response_data['web']['results']
    return sites
    