import torch
import torchaudio
import base64
import io
import json


def PitchShift(path, pitch):
    # GPUが利用可能か確認し、利用可能ならGPUを使用
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # torchaudioで音声ファイルを読み込む
    waveform, sr = torchaudio.load(path)
    waveform = waveform.to(device)

    # ピッチ変更を行うが、曲の長さは変更しないようにする
    # torchaudioのfunctionalを使用してピッチを変更
    n_steps = pitch
    waveform = torchaudio.functional.pitch_shift(waveform, sr, n_steps).to(device)

    # CPUに戻す
    waveform = waveform.cpu()

    # バイト列に変換する
    bytes = io.BytesIO()
    # torchaudioで音声データを書き込む
    torchaudio.save(bytes, waveform, sr, format="mp3")
    bytes.seek(0)

    # base64エンコードする
    b64 = base64.b64encode(bytes.read())
    # 文字列に変換する
    b64str = b64.decode("utf-8")

    # jsonで返す
    return json.dumps({"b64str": b64str})
