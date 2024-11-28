import addons.audio_separation as audio_sep
import addons.youtube_dl as youtube_dl
import addons.folder_sets as folder_sets
import os
import shutil


def make_kalyoke(url, dir):
    output_dir = dir
    folder_sets.SCF(output_dir)
    
    movie_info = youtube_dl.download_mp3_with_info(url, output_dir)
    movie_name = movie_info["title"]
    movie_id = movie_info["id"]
    movie_extractor = movie_info["extractor_key"]

    sinput_path = f"{output_dir}/{movie_id}.mp3"
    soutput_dir = f"{output_dir}/{movie_extractor}/{movie_id}"
    folder_sets.SCF(soutput_dir)
    audio_sep.single_separate(
        sinput_path, soutput_dir, device="cuda"
    )
    if os.path.exists(f"{soutput_dir}/htdemucs/{movie_id}/no_vocals.mp3"):
        folder_sets.rename_file(
            f"{soutput_dir}/htdemucs/{movie_id}/no_vocals.mp3",
            f"{soutput_dir}/no_vocals.mp3",
        )
        folder_sets.rename_file(
            f"{soutput_dir}/htdemucs/{movie_id}/vocals.mp3", f"{soutput_dir}/vocals.mp3"
        )
        shutil.rmtree(f"{soutput_dir}/htdemucs")
        os.remove(sinput_path)

        movie_data = {
            "id": movie_id,
            "title": movie_name,
            "extractor": movie_extractor,
            "folder_path": f"{soutput_dir}",
        }
        return movie_data
    else:
        return "no data"
