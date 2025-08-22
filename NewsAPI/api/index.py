from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import feedparser
import re
import urllib
from email.utils import parsedate_to_datetime

def format_date(pubdate_str: str) -> str:
    try:
        dt = parsedate_to_datetime(pubdate_str)
        return dt.isoformat()
    except Exception:
        return pubdate_str

app = FastAPI()
# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def wired_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        description = entry.get('description', '')
        thumbnail = ''
        if 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        elif 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def indiatoday_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        raw_desc = entry.get('description', '')
        thumbnail = ''
        match = re.search(r'<img[^>]+src="([^"]+)"', raw_desc)
        if match:
            thumbnail = match.group(1)
        elif 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        if '</a>' in raw_desc:
            description = raw_desc.split('</a>')[-1].strip()
        else:
            description = re.sub(r'<.*?>', '', raw_desc).strip()
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def cnbc_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        description = entry.get('description', '')
        thumbnail = ''
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def firstpost_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        description = entry.get('description', '')
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        elif 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def hindustantimes_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        raw_desc = entry.get('description', '')
        description = re.sub(r'<.*?>', '', raw_desc).strip()
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def nytimes_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url)
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '')
        raw_desc = entry.get('description', '')
        description = re.sub(r'<.*?>', '', raw_desc).strip()
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def mint_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        raw_desc = entry.get('description', '')
        description = raw_desc.strip()
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        elif 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def ndtv_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        description = entry.get('description', '') or entry.get('content', [{}])[0].get('value', '')
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        elif 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def indianexpress_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        description = entry.get('description', '')
        if not description:
            description = entry.get('content', [{}])[0].get('value', '')
        thumbnail = ''
        if 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        elif 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def toi_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        raw_desc = entry.get('description', '')
        if '</a>' in raw_desc:
            desc_text = raw_desc.split('</a>')[-1]
        else:
            desc_text = raw_desc
        description = re.sub(r'<.*?>', '', desc_text).strip()
        thumbnail = ''
        enclosures = entry.get('enclosures', [])
        if enclosures:
            thumbnail = enclosures[0].get('url', '')
        else:
            img_match = re.search(r'<img[^>]+src="([^\"]+)"', raw_desc)
            if img_match:
                thumbnail = img_match.group(1)
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def thehindu_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        description = entry.get('description', '')
        thumbnail = ''
        if 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def bbc_parser(rss_url: str, category: str):
    feed = feedparser.parse(rss_url, request_headers={'User-Agent': 'Mozilla/5.0'})
    news_items = []
    for entry in feed.entries[:10]:
        title = entry.get('title', '')
        link = entry.get('link', '')
        pubdate = entry.get('published', '') or entry.get('pubDate', '')
        description = entry.get('description', '')
        thumbnail = ''
        if 'media_thumbnail' in entry:
            thumbnail = entry['media_thumbnail'][0].get('url', '')
        elif 'media_content' in entry:
            thumbnail = entry['media_content'][0].get('url', '')
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

def techcrunch_parser(rss_url: str, category: str):
    req = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        raw_xml = resp.read().decode('utf-8', errors='ignore')
    items = re.findall(r'<item>(.*?)</item>', raw_xml, re.DOTALL)[:10]
    news_items = []
    for block in items:
        title_match = re.search(r'<title>\s*<!\[CDATA\[(.*?)\]\]>', block, re.DOTALL)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title_plain_match = re.search(r'<title>(.*?)</title>', block, re.DOTALL)
            title = title_plain_match.group(1).strip() if title_plain_match else ''
        link_match = re.search(r'<link>(.*?)</link>', block)
        link = link_match.group(1).strip() if link_match else ''
        pubdate_match = re.search(r'<pubDate>(.*?)</pubDate>', block)
        pubdate = pubdate_match.group(1).strip() if pubdate_match else ''
        desc_match = re.search(r'<description>\s*<!\[CDATA\[(.*?)\]\]>', block, re.DOTALL)
        description = desc_match.group(1).strip() if desc_match else ''
        thumb_match = re.search(r'<media:content[^>]+url="([^\"]+)"', block)
        if thumb_match:
            thumbnail = thumb_match.group(1)
        else:
            img_match = re.search(r'<img[^>]+src="([^\"]+)"', block)
            thumbnail = img_match.group(1) if img_match else ''
        news_items.append({
            'title': title,
            'link': link,
            'pubdate': format_date(pubdate),
            'description': description,
            'thumbnail_url': thumbnail,
            'category': category,
        })
    return news_items

sources = {
    "technology": {
        "wired_parser": "https://www.wired.com/feed/tag/ai/latest/rss",
        "techcrunch_parser": "https://techcrunch.com/feed/",
        "cnbc_parser": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910",
        "firstpost_parser": "https://www.firstpost.com/commonfeeds/v1/mfp/rss/tech.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
        "mint_parser": "https://www.livemint.com/rss/AI",
        "mint_parser": "https://www.livemint.com/rss/technology",
        "ndtv_parser": "https://feeds.feedburner.com/gadgets360-latest",
        "indianexpress_parser": "https://indianexpress.com/section/technology/feed/",
        "bbc_parser": "http://feeds.bbci.co.uk/news/technology/rss.xml",
        "techcrunch_parser": "https://techcrunch.com/feed/"
    },
    "sports": {
        "indiatoday_parser": "https://www.indiatoday.in/rss/1206550",
        "firstpost_parser": "https://www.firstpost.com/commonfeeds/v1/mfp/rss/sports.xml",
        "indianexpress_parser": "https://indianexpress.com/section/sports/cricket/feed/",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
        "mint_parser": "https://www.livemint.com/rss/sports",
        "ndtv_parser": "https://feeds.feedburner.com/ndtvsports-latest",
        "indianexpress_parser": "https://indianexpress.com/section/sports/feed/",
        "toi_parser": "http://timesofindia.indiatimes.com/rssfeeds/54829575.cms",
        "toi_parser": "http://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
        "thehindu_parser": "https://www.thehindu.com/sport/cricket/feeder/default.rss",
        "thehindu_parser": "https://www.thehindu.com/sport/other-sports/feeder/default.rss"
    },
    "business": {
        "wired_parser": "https://www.wired.com/feed/category/business/latest/rss",
        "cnbc_parser": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
        "firstpost_parser": "https://www.firstpost.com/commonfeeds/v1/mfp/rss/business.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/SmallBusiness.xml",
        "mint_parser": "https://www.livemint.com/rss/companies",
        "mint_parser": "https://www.livemint.com/rss/markets",
        "ndtv_parser": "https://feeds.feedburner.com/ndtvprofit-latest",
        "toi_parser": "http://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
        "thehindu_parser": "https://www.thehindu.com/business/agri-business/feeder/default.rss",
        "thehindu_parser": "https://www.thehindu.com/business/Industry/feeder/default.rss",
        "thehindu_parser": "https://www.thehindu.com/business/Economy/feeder/default.rss",
        "bbc_parser": "http://feeds.bbci.co.uk/news/business/rss.xml"
    },
    "science": {
        "wired_parser": "https://www.wired.com/feed/category/science/latest/rss",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/science/rssfeed.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Space.xml",
        "mint_parser": "https://www.livemint.com/rss/science",
        "indianexpress_parser": "https://indianexpress.com/section/technology/science/feed/",
        "toi_parser": "http://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms",
        "bbc_parser": "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml"
    },
    "health": {
        "bbc_parser": "http://feeds.bbci.co.uk/news/health/rss.xml",
        "indianexpress_parser": "https://indianexpress.com/section/lifestyle/health/feed/",
        "indianexpress_parser": "https://indianexpress.com/section/health-wellness/feed/",
        "ndtv_parser": "https://feeds.feedburner.com/ndtvcooks-latest",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
        "nytimes_parser": "https://rss.nytimes.com/services/xml/rss/nyt/Well.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/lifestyle/health/rssfeed.xml",
        "firstpost_parser": "https://www.firstpost.com/commonfeeds/v1/mfp/rss/health.xml",
        "cnbc_parser": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000108"
    },
    "entertainment": {
        "firstpost_parser": "https://www.firstpost.com/commonfeeds/v1/mfp/rss/entertainment.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/entertainment/music/rssfeed.xml",
        "hindustantimes_parser": "https://www.hindustantimes.com/feeds/rss/entertainment/hollywood/rssfeed.xml",
        "indianexpress_parser": "https://indianexpress.com/section/entertainment/bigg-boss/feed/",
        "indianexpress_parser": "https://indianexpress.com/section/entertainment/feed/",
        "indianexpress_parser": "https://indianexpress.com/section/entertainment/movie-review/feed/",
        "toi_parser": "http://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
        "bbc_parser": "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
        "thehindu_parser": "https://www.thehindu.com/entertainment/art/feeder/default.rss",
        "thehindu_parser": "https://www.thehindu.com/entertainment/dance/feeder/default.rss"
    }
}


# Category endpoints
@app.get("/technology")
async def get_technology(limit: int = 10):
    news_items = []
    for parser_name, url in sources["technology"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "technology"))
    # Sort by pubdate descending
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]

@app.get("/sports")
async def get_sports(limit: int = 10):
    news_items = []
    for parser_name, url in sources["sports"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "sports"))
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]

@app.get("/business")
async def get_business(limit: int = 10):
    news_items = []
    for parser_name, url in sources["business"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "business"))
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]

@app.get("/science")
async def get_science(limit: int = 10):
    news_items = []
    for parser_name, url in sources["science"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "science"))
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]

@app.get("/health")
async def get_health(limit: int = 10):
    news_items = []
    for parser_name, url in sources["health"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "health"))
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]

@app.get("/entertainment")
async def get_entertainment(limit: int = 10):
    news_items = []
    for parser_name, url in sources["entertainment"].items():
        parser = globals().get(parser_name)
        if parser:
            news_items.extend(parser(url, "entertainment"))
    news_items.sort(key=lambda x: x['pubdate'], reverse=True)
    return news_items[:limit]


@app.get("/")
async def read_root():
    return {"message": "API is up!"}

