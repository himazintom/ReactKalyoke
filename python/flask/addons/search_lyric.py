import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from lyricsgenius import Genius
import os

# ログ設定
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

genius_token = os.getenv("GENIUS_TOKEN")
genius = Genius(genius_token)

def sort_urls_by_domain_priority(urls):
    domain_priority = [
        "atwiki.jp",
        "j-lyric.net",
        "uta-net.com",
        "utaten.com",
        "vocaloidlyrics.fandom.com",
        "genius.com",
        "kkbox.com",
        "linkco.re",
    ]
    sorted_urls = []
    for domain in domain_priority:
        for url in urls:
            if domain in url:
                sorted_urls.append(url)
    return sorted_urls


def check_domain(url):
    domains = [
        "vocaloidlyrics.fandom.com",
        "genius.com",
        "j-lyric.net",
        "uta-net.com",
        "utaten.com",
        "atwiki.jp",
        "kkbox.com",
        "linkco.re",
    ]
    return any(domain in url for domain in domains)


def get_lyric(url):
    gl = ""

    try:
        if "vocaloidlyrics.fandom.com" in url:
            logger.info(f"Accessing 'vocaloidlyrics.fandom.com' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            table = doc.select_one(".mw-parser-output table")
            if not table:
                return "テーブルが見つかりませんでした", 404

            trs = table.find_all("tr")
            for tr in trs[1:-1]:
                temp = tr.find_all("td")[0]
                str_tr = temp.get_text(separator="", strip=True)
                gl += str_tr + "\n"
            return gl

        hostname = urlparse(url).hostname
        domain = ".".join(hostname.split(".")[-2:]) if hostname else ""

        if domain == "genius.com":
            logger.info(f"Accessing 'genius.com' for URL: {url}")
            try:
                temp_gl = genius.lyrics(song_url=url)

                if temp_gl is None:
                    return ""
                temp_gl = temp_gl.split("\n")
                for temp in temp_gl:
                    if "[" in temp and "]" in temp:
                        continue
                    gl += temp + "\n"
                return gl
            except requests.HTTPError as http_err:
                logger.error(f"HTTP error on Genius: {http_err}")
                return ""
            except Exception as err:
                logger.error(f"Error on Genius: {err}")
                return ""

        elif domain == "j-lyric.net":
            logger.info(f"Accessing 'j-lyric.net' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            str_doc = str(doc.select_one("#Lyric"))
            gl = (
                str_doc.replace("<br/>", "\n")
                .replace('<p id="Lyric">', "")
                .replace("</p>", "")
            )

        elif domain == "uta-net.com":
            logger.info(f"Accessing 'uta-net.com' for URL: {url}")
            if "song" in url or "movie" in url:
                response = requests.get(url)
                response.raise_for_status()
                doc = BeautifulSoup(response.text, "html.parser")
                str_doc = str(doc.select_one("#kashi_area"))
                gl = (
                    str_doc.replace("<br/>", "\n")
                    .replace('<div id="kashi_area" itemprop="text">', "")
                    .replace("</div>", "")
                )
                logger.info(f"gl: {gl}")

                if gl == "None":
                    kashi_doc = doc.select_one(".row.kashi .col-12.px-0.px-lg-3 div")
                    if kashi_doc:
                        str_doc = str(kashi_doc.select_one("div"))
                        gl = (
                            str_doc.replace("<br/>", "\n")
                            .replace("</div>", "")
                            .replace("<div>", "")
                        )
                        logger.info(f"gl last: {gl}")
                    else:
                        logger.error(f"kashi_doc が見つかりませんでした。URL: {url}")
                        return ""


        elif domain == "utaten.com":
            logger.info(f"Accessing 'utaten.com' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            romaji_elements = doc.select(".romaji")
            if romaji_elements:
                romaji_elements = romaji_elements[0].contents
                for element in romaji_elements:
                    if element.name == "br":
                        gl += "\n"
                    elif element.name == "span" and "ruby" in element.get("class", []):
                        kanji = (
                            element.select_one(".rb").get_text(strip=True)
                            if element.select_one(".rb")
                            else ""
                        )
                        gl += kanji
                    elif isinstance(element, str):
                        gl += element.strip()
                gl = gl.strip()
            else:
                logger.warning("Error: .romaji class not found in the document")

        elif domain == "atwiki.jp":
            logger.info(f"Accessing 'atwiki.jp' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            if "/hmiku/" in url:
                start = doc.find("h3", id="id_0a172479")
                end = doc.find("h3", id="id_ca80e710")
                if start and end:
                    lyrics = ""
                    element = start.find_next_sibling()
                    while element != end:
                        if element.name == "div" and element.get_text(strip=True):
                            lyrics += (
                                element.get_text(separator="\n", strip=True) + "\n\n"
                            )
                        element = element.find_next_sibling()
                    gl = lyrics.strip()
                else:
                    logger.warning("指定されたIDを持つ<h3>タグが見つかりませんでした。")

        elif domain == "kkbox.com":
            logger.info(f"Accessing 'kkbox.com' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            str_doc = str(doc.select_one(".lyrics"))
            gl = (
                str_doc.replace("<br/>", "")
                .replace('<div class="lyrics">', "")
                .replace("</p>", "")
                .replace("<p>", "")
                .replace("</div>", "")
            )
            gl = gl[4:-1]

        elif domain == "linkco.re":
            logger.info(f"Accessing 'linkco.re' for URL: {url}")
            response = requests.get(url)
            response.raise_for_status()
            doc = BeautifulSoup(response.text, "html.parser")
            str_doc = str(doc.select_one(".lyric_lyric .lyric_text"))
            gl = (
                str_doc.replace("<br/>", "")
                .replace('<div class="lyric_text">', "")
                .replace("</p>", "")
                .replace("<p>", "\n")
                .replace("</div>", "")
            )

    except requests.RequestException as e:
        logger.error(f"Error fetching the URL: {e}")
        return ""

    return gl
