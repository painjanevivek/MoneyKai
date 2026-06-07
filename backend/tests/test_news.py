from backend.app.services.news_service import _parse_feed_items, _sort_and_dedupe


def test_parse_rss_feed_classifies_fintech_and_finance():
    xml = """
    <rss version="2.0">
      <channel>
        <item>
          <title>Fintech startup launches new payment feature</title>
          <description>A new payments product is rolling out for users.</description>
          <link>https://example.com/fintech-story</link>
          <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Markets rally as rates cool</title>
          <description>Investors watch the latest market signals.</description>
          <link>https://example.com/finance-story</link>
          <pubDate>Mon, 01 Jan 2024 09:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
    """

    items = _parse_feed_items(xml, "Example Feed", "finance")
    assert len(items) == 2
    assert items[0]["category"] == "fintech"
    assert items[1]["category"] == "finance"
    assert items[0]["source"] == "Example Feed"


def test_sort_and_dedupe_keeps_latest_item():
    items = [
        {
            "id": "1",
            "title": "Older",
            "description": "Older item",
            "source": "Feed",
            "url": "https://example.com/story",
            "image": None,
            "publishedAt": "2024-01-01T08:00:00Z",
            "category": "finance",
            "categoryLabel": "Finance",
        },
        {
            "id": "2",
            "title": "Newer",
            "description": "Newer item",
            "source": "Feed",
            "url": "https://example.com/story",
            "image": None,
            "publishedAt": "2024-01-01T09:00:00Z",
            "category": "finance",
            "categoryLabel": "Finance",
        },
    ]

    result = _sort_and_dedupe(items)
    assert len(result) == 1
    assert result[0]["title"] == "Newer"
