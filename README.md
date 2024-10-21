1.Prepare .env
NODE_ENV=production
REACT_APP_HOST_URL=[YourDomain]
REACT_APP_API_URL=[YourDomain]

DB_ROOT_PASSWORD=[RootPass]
DB_NAME=[Name]
DB_USER=[User]
DB_PASSWORD=[Pass]



・全体を起動
docker-compose up -d　--build


・react-kalyoke-webニアクセス
docker exec -it react-kalyoke-web sh
systemctl restart nginx


・mariaDBだけ起動
cd db
docker build -t react-kalyoke-db .
docker run -d --rm --name react-kalyoke-db -v /db/db_data:/var/lib/mysql -p 3306:3306 react-kalyoke-db


・mariaDBにアクセス
docker exec -it react-kalyoke-db bash
mariadb -u root -p