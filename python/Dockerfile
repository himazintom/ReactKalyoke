FROM nvcr.io/nvidia/pytorch:24.08-py3

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  libpcre3 \
  libpcre3-dev \
  && apt-get clean \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir demucs flask torch torchaudio torchvision yt-dlp opencv-python jaconv mysql-connector-python bs4 lyricsgenius flask-cors

# uWSGIをPCREサポート付きでインストール
RUN pip install --no-cache-dir uwsgi

# 必要なディレクトリを作成し、所有者を変更
RUN mkdir -p /var/www/apache-flask/app/static/output
RUN mkdir /var/www/.cache
RUN mkdir /flask
COPY ./flask /flask
RUN chown -R www-data:www-data /var/www /flask

# init.shをコンテナに追加
COPY init.sh /usr/local/bin/init.sh
RUN chmod 777 /usr/local/bin/init.sh

# uwsgi.iniをコピー
COPY uwsgi.ini uwsgi.ini

# ユーザーを切り替え
# USER www-data

# 中継システム起動
CMD ["uwsgi", "--ini", "uwsgi.ini"]
