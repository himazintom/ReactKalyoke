D:
cd ui-test
docker build -t react-kalyoke-web .
docker run -p 3000:80 react-kalyoke-web


・ノートパソコン上のローカルでreactサーバーを開く場合
C:
cd ui-test
npm run build
serve -s build

・mariaDBだけを開きたい場合
docker run -d --name react-kalyoke-db -e MYSQL_ROOT_PASSWORD="pass" -e MYSQL_DATABASE=kalyoke -e MYSQL_USER=IME -e MYSQL_PASSWORD=passss -p 3306:3306 -v db_data:/var/lib/mysql  mariadb:latest