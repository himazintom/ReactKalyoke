import yt_dlp
import os
import time


def get_video_duration(youtube_url):
    with yt_dlp.YoutubeDL() as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        duration = info["duration"]
        return duration


def get_video_title(youtube_url):
    with yt_dlp.YoutubeDL() as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        title = info["title"]
        return title


def download_mp3_with_info(youtube_url, output_dir, retries=3, delay=5):
    out_dir = output_dir or "./output"
    os.makedirs(out_dir, exist_ok=True)
    ydl_opts = {
        "quiet": True,
        "format": "bestaudio/best",
        "outtmpl": f"{out_dir}/%(id)s.%(ext)s",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }
    for attempt in range(retries):  # もしダウンロードに失敗したら何回か繰り返す
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(youtube_url, download=True)
                return info
        except yt_dlp.utils.DownloadError as e:
            print(f"エラーが発生しました: {e}. {delay}秒後に再試行します。")
            time.sleep(delay)
    return None


def get_playlist_video_info(playlist_url):
    ydl_opts = {
        "quiet": True,
        "extract_flat": False,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            if "entries" in info:
                video_info_list = [
                    {
                        "videoid": video_data["id"],
                        "title": video_data.get("title", "タイトルがありません"),
                        "thumbnail": video_data.get(
                            "thumbnail", "サムネイルがありません"
                        ),
                    }
                    for video_data in info["entries"]
                ]
            else:
                video_info_list = []  # 'entries'が存在しない場合は空のリストを返す
    except yt_dlp.utils.DownloadError as e:
        print(f"エラーが発生しました: {e}")
        video_info_list = []  # エラーが発生した場合は空のリストを返す
    return video_info_list
