import os

def SCF(folder_path):#search_or_create_folder
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        #print(f"フォルダ '{folder_path}' を作成しました。")
        return False
    else:
        print(f"フォルダ '{folder_path}' は既に存在します。")
        return True

# ファイル名を変更する関数
def rename_file(old_name, new_name):
    print(f"old_name={old_name}, new_name={new_name}")
    try:
        os.rename(old_name, new_name)
        print(f"ファイル名を {new_name} に変更しました。")
    except FileNotFoundError:
        print("指定したファイルが見つかりません。")
    except FileExistsError:
        print("指定したファイル名がすでに存在します。")