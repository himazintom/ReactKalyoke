import Addons.DEMUCS.AudioSeparation as AS
import Addons.DEMUCS.youtubeDL as ytdl
import Addons.DEMUCS.folder_sets as fs
import os
import Addons.DEMUCS.DeleteStringForFiles as DSFF
import shutil
import Addons.DEMUCS.InputLyrics as IL

def make_kalyoke(url, dir):
    output_dir=dir
    fs.SCF(output_dir)

    # duration=ytdl.get_video_duration(url)
    # max_time=7*60
    # if status=="free":
    #     max_time=15*60
    # if status=="singer":
    #     max_time=20*60
    # if(duration>max_time):
    #     return "time long"
    movie_info = ytdl.download_mp3_with_info(url, output_dir)
    movie_name = movie_info["title"]
    movie_id = movie_info["id"]
    movie_extractor=movie_info["extractor_key"]

    # #print(f"before={movie_name}, after={after_movie_name}")
    sinput_path=f"{output_dir}/{movie_id}.mp3"
    soutput_dir=f"{output_dir}/{movie_extractor}/{movie_id}"
    fs.SCF(soutput_dir)
    AS.single_separate(sinput_path,soutput_dir,device="cuda") #*^* AS.single_separate(sinput_path,soutput_dir,device="cpu")
    if os.path.exists(f"{soutput_dir}/htdemucs/{movie_id}/no_vocals.mp3"):
        fs.rename_file(f"{soutput_dir}/htdemucs/{movie_id}/no_vocals.mp3", f"{soutput_dir}/no_vocals.mp3")
        fs.rename_file(f"{soutput_dir}/htdemucs/{movie_id}/vocals.mp3", f"{soutput_dir}/vocals.mp3")
        shutil.rmtree(f"{soutput_dir}/htdemucs")
        os.remove(sinput_path)

        movie_datas={
            "id": movie_id,
            "title": movie_name,
            "extractor": movie_extractor,
            "folder_path": f"{soutput_dir}"
        }
        return movie_datas
    else:
        return "no data"