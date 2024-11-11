# ベースイメージとしてNode.jsを使用
FROM node:23-alpine3.19

# アプリケーションディレクトリを作成
WORKDIR /app

# Dockerfile内で環境変数を使いたい場合には、以下のようにする
ARG REACT_APP_HOST_URL
ENV REACT_APP_HOST_URL=${REACT_APP_HOST_URL}

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

ARG REACT_APP_GOOGLE_API_KEY
ENV REACT_APP_GOOGLE_API_KEY=${REACT_APP_GOOGLE_API_KEY}

ARG REACT_APP_SEARCH_ENGINE_ID
ENV REACT_APP_SEARCH_ENGINE_ID=${REACT_APP_SEARCH_ENGINE_ID}

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
# RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 静的ファイルを提供するために、Nginxを使用
FROM nginx:1.27.2-alpine

# 必要なファイルをコピー
COPY --from=0 /app/build /usr/share/nginx/html
COPY keys /keys
COPY conf.d /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# エントリーポイントとコマンドを設定
ENTRYPOINT ["docker-entrypoint.sh"]
# Nginxをフォアグラウンドで起動
CMD ["nginx", "-g", "daemon off;"]