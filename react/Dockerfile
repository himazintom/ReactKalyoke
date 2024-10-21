# ベースイメージとしてNode.jsを使用
FROM node:16-alpine

# Dockerfile内で環境変数を使いたい場合には、以下のようにする
ARG REACT_APP_HOST_URL
ENV REACT_APP_HOST_URL=${REACT_APP_HOST_URL}

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# アプリケーションディレクトリを作成
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 静的ファイルを提供するために、Nginxを使用
FROM nginx:alpine

# Reactビルド成果物をNginxのHTMLディレクトリにコピー
COPY --from=0 /app/build /usr/share/nginx/html

#https用の暗号カギを指定位置へコピー
COPY keys /keys
# Nginxの設定ファイルをコンテナ内の適切なディレクトリにコピー
COPY conf.d /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/nginx.conf

# エントリーポイントスクリプトをコピー
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# エントリーポイントとコマンドを設定
ENTRYPOINT ["docker-entrypoint.sh"]
# Nginxをフォアグラウンドで起動
CMD ["nginx", "-g", "daemon off;"]