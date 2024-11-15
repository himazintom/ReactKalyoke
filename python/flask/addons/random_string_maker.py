import random
import string
import hashlib
import os


def generate_password(length=16):
    characters = string.ascii_letters + string.digits
    password = "".join(random.choice(characters) for i in range(length))
    return password


def hash_password(password):
    hasher = hashlib.sha256()
    hasher.update(password.encode("utf-8"))
    return hasher.hexdigest()


def generate_salt():
    # 安全なランダムソルトを生成
    return os.urandom(16)


def hash_email_with_salt(email, salt):
    # メールアドレスとソルトを組み合わせてハッシュ化
    hasher = hashlib.sha256()  # SHA-256: 64桁の16進数だからCHAR(64)が適切らしい
    hasher.update(email.encode("utf-8"))
    hasher.update(salt)
    return hasher.hexdigest()


def generate_login_token(id):
    hasher = hashlib.sha256()
    # idを文字列に変換し、バイト型にエンコード
    id_bytes = str(id).encode("utf-8")
    hasher.update(id_bytes)
    hasher.update(generate_salt())
    return hasher.hexdigest()
