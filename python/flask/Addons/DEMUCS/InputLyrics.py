
def LyricInput():
    text = ""
    time=3
    print("歌詞を入力してください")
    while True:
        line = input()
        if line == "":
            print(f"歌詞の入力を終了するときはEnterをあと{time}回押してください")
            time-=1
            if time<=0:
                break
        else:
            time=3
            
        text += line + "\n"

        # 各行を格納するたびに、現在の `text` を表示
        #print("現在の入力内容:")
        #print(text)

    print("入力が完了しました。")
    #print("最終的なテキスト:")
    #print(text)
    cleaned_lines = [line for line in text.splitlines() if line.strip() != ""]#空白の行を消してる
    cleaned_text = "\n".join(cleaned_lines)
    #print(cleaned_text)
    return cleaned_text