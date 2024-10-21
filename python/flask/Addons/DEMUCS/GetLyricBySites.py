import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from lyricsgenius import Genius

token = "gFwbpRJA68wzOnW3qJV3v9wPGhlOYSLS_wSHSNscAfNbPjkXF7ztq6qImyiI3c93"
genius = Genius(token)

def sort_urls_by_domain_priority(urls):
    # ドメインの優先順位
    domain_priority = ['atwiki.jp', 'j-lyric.net', 'uta-net.com', 'utaten.com', 'vocaloidlyrics.fandom.com', 'genius.com', 'kkbox.com', 'linkco.re']
    sorted_urls = []
    for domain in domain_priority:
        for url in urls:
            if domain in url:
                sorted_urls.append(url)
    return sorted_urls

def check_domain(url):
    domains = ['vocaloidlyrics.fandom.com', 'genius.com', 'j-lyric.net', 'uta-net.com', 'utaten.com', 'atwiki.jp', 'kkbox.com', 'linkco.re']
    return any(domain in url for domain in domains)

def get_lyric(url):    
    gl = ''
    
    try:
        # 'vocaloidlyrics.fandom.com' ドメイン用の処理
        if 'vocaloidlyrics.fandom.com' in url:
            response = requests.get(url)
            response.raise_for_status()  # レスポンスが成功したか確認
            doc = BeautifulSoup(response.text, 'html.parser')
            table = doc.select_one('.mw-parser-output table')
            
            if not table:
                return 'テーブルが見つかりませんでした', 404

            trs = table.find_all('tr')
            for tr in trs[1:-1]:  # 最初と最後の行を除外して日本語歌詞を取得
                temp = tr.find_all('td')[0]
                str_tr = temp.get_text(separator='', strip=True)
                gl += str_tr + '\n'

            return gl
        
        # URLからホスト名を取得
        hostname = urlparse(url).hostname
        domain = '.'.join(hostname.split('.')[-2:]) if hostname else ''
        
        # Genius.com ドメインの処理
        if domain == 'genius.com':
            try:
                temp_gl = genius.lyrics(song_url=url)
                if temp_gl is None:
                    return ''
                
                temp_gl = temp_gl.split('\n')
                for temp in temp_gl:
                    if '[' in temp and ']' in temp:
                        continue
                    gl += temp + '\n'
                return gl
            except requests.HTTPError as http_err:
                print(f"HTTP error occurred: {http_err}")
                return f"Error: Unable to retrieve lyrics, received {http_err}"
            except Exception as err:
                print(f"An error occurred: {err}")
                return f"Error: Something went wrong while retrieving lyrics."
        
        # j-lyric.net ドメインの処理
        elif domain == 'j-lyric.net':
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, 'html.parser')
            str_doc = str(doc.select_one('#Lyric'))
            gl = str_doc.replace('<br/>', '\n').replace('<p id="Lyric">', '').replace('</p>', '')
        
        # uta-net.com ドメインの処理
        elif domain == 'uta-net.com':
            if 'song' in url:
                response = requests.get(url)
                response.raise_for_status()
                doc = BeautifulSoup(response.text, 'html.parser')
                str_doc = str(doc.select_one('#kashi_area'))
                gl = str_doc.replace('<br/>', '\n').replace('<div id="kashi_area" itemprop="text">', '').replace('</div>', '')
                if gl == "None":
                    kashi_doc = doc.select_one('.row .kashi')
                    str_doc = str(kashi_doc.select_one('.row.kashi .col-12.px-2.px-lg-3 div'))
                    gl = str_doc.replace('<br/>', '\n').replace('</div>', '').replace('<div>', '')
        
        # utaten.com ドメインの処理
        elif domain == 'utaten.com':
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, 'html.parser')
            romaji_elements = doc.select('.romaji')
            if romaji_elements:
                romaji_elements = romaji_elements[0].contents
                for element in romaji_elements:
                    if element.name == 'br':
                        gl += '\n'
                    elif element.name == 'span' and 'ruby' in element.get('class', []):
                        kanji = element.select_one('.rb').get_text(strip=True) if element.select_one('.rb') else ''
                        gl += kanji
                    elif isinstance(element, str):
                        gl += element.strip()
                gl = gl.strip()
            else:
                print("Error: .romaji class not found in the document")
        
        # atwiki.jp ドメインの処理
        elif domain == 'atwiki.jp':
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, 'html.parser')
            if '/hmiku/' in url:
                start = doc.find('h3', id='id_0a172479')
                end = doc.find('h3', id='id_ca80e710')
                if start and end:
                    lyrics = ''
                    element = start.find_next_sibling()
                    while element != end:
                        if element.name == 'div' and element.get_text(strip=True):
                            lyrics += element.get_text(separator='\n', strip=True) + '\n\n'
                        element = element.find_next_sibling()
                    gl = lyrics.strip()
                else:
                    print("指定されたIDを持つ<h3>タグが見つかりませんでした。")
            elif '/touhoukashi/' in url:
                lyrics_div = doc.select_one('#lyrics')
                if lyrics_div:
                    for ruby in lyrics_div.find_all('ruby'):
                        rb = ruby.find('rb')
                        rt = ruby.find('rt')
                        if rb and rt:
                            ruby_text = f"{rb.get_text()}"
                            rt_text = f"({rt.get_text()})"
                            ruby.replace_with(ruby_text + rt_text)
                    tstr_lyric = str(lyrics_div.get_text())
                    lines = tstr_lyric.split('\n')
                    i = 0
                    while i < len(lines):
                        if lines[i] == '' and (i + 1 < len(lines) and lines[i + 1] == ''):
                            i += 1
                            gl += '\n'
                        elif lines[i] == '' and (i + 1 == len(lines) or lines[i + 1] != ''):
                            gl += '\n'
                        else:
                            gl += lines[i]
                        i += 1

        # kkbox.com ドメインの処理
        elif domain == 'kkbox.com':
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, 'html.parser')
            str_doc = str(doc.select_one('.lyrics'))
            gl = str_doc.replace('<br/>', '').replace('<div class="lyrics">', '').replace('</p>', '').replace('<p>', '').replace('</div>', '')
            gl = gl[4:-1]

        # linkco.re ドメインの処理
        elif domain == 'linkco.re':
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, 'html.parser')
            str_doc = str(doc.select_one('.lyric_lyric .lyric_text'))
            gl = str_doc.replace('<br/>', '').replace('<div class="lyric_text">', '').replace('</p>', '').replace('<p>', '\n').replace('</div>', '')

    except requests.RequestException as e:
        print(f"Error fetching the URL: {e}")
        return f"Error: Unable to retrieve the page content due to network or server issues."
    
    return gl
