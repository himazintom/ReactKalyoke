import os
import demucs

import io
from pathlib import Path
import select
from shutil import rmtree
import subprocess as sp
import sys
from typing import Dict, Tuple, Optional, IO

model = "htdemucs"
extensions = ["mp3", "wav", "ogg", "flac"]  # we will look for all those file types.

# Options for the output audio.
mp3 = True
mp3_rate = 320
float32 = False  # output as float 32 wavs, unsused if 'mp3' is True.
int24 = False    # output as int24 wavs, unused if 'mp3' is True.
# You cannot set both `float32 = True` and `int24 = True` !!

input_path=""
input_dir="./output"
output_dir="/output"

def copy_process_streams(process: sp.Popen):
    out, err = process.communicate()
    print(out.decode())
    print(err.decode())
    


def single_separate(inp=None, outd=None, separate_only_vocal=True, device="cpu"):
    global mp3,float32,int24,input_path,output_dir
    inp = inp or input_path
    print(f"inp={inp}")
    outd = outd or output_dir
    two_stems = "vocals" if separate_only_vocal==True else None
    cmd = ["python3", "-m", "demucs.separate", "-o", f"{str(outd)}", "-n", model, "-d", device]
    if mp3:
        cmd += ["--mp3", f"--mp3-bitrate={mp3_rate}"]
    if float32:
        cmd += ["--float32"]
    if int24:
        cmd += ["--int24"]
    if two_stems is not None:
        cmd += [f"--two-stems={two_stems}"]
    current_directory = os.getcwd()
    #print("現在のカレントディレクトリ：", current_directory)
    if not os.path.exists(inp):
        print(f"No valid audio files in {inp}")
        return
    print("Going to separate the files:")
    print('\n'.join(inp))
    print("With command: ", " ".join(cmd))
    print(f"command={cmd + [inp]}")
    p = sp.Popen(cmd + [inp], stdout=sp.PIPE, stderr=sp.PIPE)
    copy_process_streams(p)
    p.wait()
    if p.returncode != 0:
        print("Command failed, something went wrong.")

def find_files(in_path):
    out = []
    for file in Path(in_path).iterdir():
        if file.suffix.lower().lstrip(".") in extensions:
            out.append(file)
    return out

def multi_separate(inp=None, outd=None, separate_only_vocal=True, device="cpu"):
    global mp3,float32,int24,input_dir,output_dir
    inp = inp or input_dir
    outp = outp or output_dir
    cmd = ["python3", "-m", "demucs.separate", "-o", str(outd), "-n", model, "-d", device]
    two_stems = "vocals" if separate_only_vocal==True else None
    if mp3:
        cmd += ["--mp3", f"--mp3-bitrate={mp3_rate}"]
    if float32:
        cmd += ["--float32"]
    if int24:
        cmd += ["--int24"]
    if two_stems is not None:
        cmd += [f"--two-stems={two_stems}"]
    files = [str(f) for f in find_files(inp)]
    if not files:
        print(f"No valid audio files in {inp}")
        return
    print("Going to separate the files:")
    print('\n'.join(files))
    print("With command: ", " ".join(cmd))
    p = sp.Popen(cmd + files, stdout=sp.PIPE, stderr=sp.PIPE)
    copy_process_streams(p)
    p.wait()
    if p.returncode != 0:
        print("Command failed, something went wrong.")