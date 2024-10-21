import os
from dotenv import load_dotenv

# 開発環境の場合
if os.getenv('APP_ENV') == 'development':
    dotenv_path = '.env.development'
# 本番環境の場合
elif os.getenv('APP_ENV') == 'production':
    dotenv_path = '.env.production'
else:
    dotenv_path = '.env'

load_dotenv(verbose=True, dotenv_path=dotenv_path)