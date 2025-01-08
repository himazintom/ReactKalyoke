# ベースイメージとしてNode.jsを使用
FROM node:16-alpine

# アプリケーションディレクトリを作成
WORKDIR /app

# 環境変数の設定
ARG REACT_APP_HOST_URL
ARG REACT_APP_API_URL
ARG REACT_APP_GOOGLE_API_KEY
ARG REACT_APP_SEARCH_ENGINE_ID
ARG REACT_APP_BRAVE_API_KEY
ARG REACT_APP_LYRIC_UPDATE_INTERVAL_DAY
ARG REACT_APP_GOOGLE_ANALYTICS_KEY

ENV REACT_APP_HOST_URL=${REACT_APP_HOST_URL} \
    REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_GOOGLE_API_KEY=${REACT_APP_GOOGLE_API_KEY} \
    REACT_APP_SEARCH_ENGINE_ID=${REACT_APP_SEARCH_ENGINE_ID} \
    REACT_APP_BRAVE_API_KEY=${REACT_APP_BRAVE_API_KEY} \
    REACT_APP_LYRIC_UPDATE_INTERVAL_DAY=${REACT_APP_LYRIC_UPDATE_INTERVAL_DAY}\
    REACT_APP_GOOGLE_ANALYTICS_KEY=${REACT_APP_GOOGLE_ANALYTICS_KEY}

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係を一度のRUNコマンドでインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# ビルド
ENV NODE_ENV=production
RUN npm run build

# Nginxステージ
FROM nginx:1.27.2-alpine

# 必要なファイルをコピー（すべてを1つのRUNコマンドに）
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