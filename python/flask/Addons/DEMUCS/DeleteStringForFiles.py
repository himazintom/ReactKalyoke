import string

def sanitize_filename(filename):
    # ファイル名に使えない文字のリスト
    invalid_chars = r'／＼＊\/:*?"<>|'
    # ファイル名に使える文字のリスト（英数字とスペース）
    # 一般的なASCII文字セット
    valid_chars = string.ascii_letters + string.digits + " "

    # ファイル名に使えない文字を除外
    sanitized_filename = "".join(c for c in filename if c in valid_chars or c not in invalid_chars)
    # スペースをアンダースコアに置き換え
    sanitized_filename = sanitized_filename.replace(" ", "_")

    return sanitized_filename

# ファイル名に使えない文字が含まれる文字列をテスト
# filename_with_invalid_chars = "Hello? \\ ??$world:*"
# sanitized_filename = sanitize_filename(filename_with_invalid_chars)
# print("元の文字列：", filename_with_invalid_chars)
# print("ファイル名に使える文字列：", sanitized_filename)
