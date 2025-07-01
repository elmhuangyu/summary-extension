from fastapi import HTTPException
from main import (
    convert_cookies_to_netscape_format,
    Cookies,
    choose_subtitle,
    extract_site_and_video_id,
)
from ytdlp import ListYtdlpSubtitlesResult, SubType, DownloadYtdlpSubtitlesRequest

import pytest
import os
import tempfile


def test_youtube_url_with_v_param():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    site, video_id = extract_site_and_video_id(url)
    assert site == "youtube"
    assert video_id == "dQw4w9WgXcQ"


def test_youtube_short_url():
    url = "https://youtu.be/dQw4w9WgXcQ"
    site, video_id = extract_site_and_video_id(url)
    assert site == "youtube"
    assert video_id == "dQw4w9WgXcQ"


def test_bilibili_bv_url():
    url = "https://www.bilibili.com/video/BV1xx411c7xx"
    site, video_id = extract_site_and_video_id(url)
    assert site == "bilibili"
    assert video_id == "BV1xx411c7xx"


def test_bilibili_av_url():
    url = "https://www.bilibili.com/video/av12345678"
    site, video_id = extract_site_and_video_id(url)
    assert site == "bilibili"
    assert video_id == "av12345678"


def test_unsupported_site():
    url = "https://www.vimeo.com/123456789"
    with pytest.raises(
        HTTPException,
        match="400: Unsupported site. Only YouTube and Bilibili are supported.",
    ):
        extract_site_and_video_id(url)


def test_youtube_url_no_video_id():
    url = "https://www.youtube.com/feed/trending"
    with pytest.raises(
        HTTPException, match="400: Could not extract video ID from URL for youtube."
    ):
        extract_site_and_video_id(url)


def test_bilibili_url_no_video_id():
    url = "https://www.bilibili.com/anime/"
    with pytest.raises(
        HTTPException, match="400: Could not extract video ID from URL for bilibili."
    ):
        extract_site_and_video_id(url)


def test_convert_cookies_to_netscape_format():
    cookies_data = [
        Cookies(
            domain=".example.com",
            includeSubdomains=True,
            path="/",
            secure=True,
            expiry=1678886400,
            name="cookie1",
            value="value1",
        ),
        Cookies(
            domain="sub.example.com",
            includeSubdomains=False,
            path="/path",
            secure=False,
            expiry=1678886500,
            name="cookie2",
            value="value2",
        ),
    ]

    expected_content = (
        "# Netscape HTTP Cookie File\n"
        "# This is a generated file! Do not edit.\n\n"
        ".example.com\tTRUE\t/\tTRUE\t1678886400\tcookie1\tvalue1\n"
        "sub.example.com\tFALSE\t/path\tFALSE\t1678886500\tcookie2\tvalue2\n"
    )

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as tmp_file:
        temp_filename = tmp_file.name

    try:
        convert_cookies_to_netscape_format(cookies_data, temp_filename)
        with open(temp_filename, "r") as f:
            content = f.read()
        assert content == expected_content
    finally:
        os.remove(temp_filename)


@pytest.mark.parametrize(
    "name, subs, video_url, expected_req",
    [
        (
            "owner_uploaded_english",
            ListYtdlpSubtitlesResult(
                subtitles=["fr", "en", "es"], automaticCaptions=["en", "fr"]
            ),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.Subtitles,
                lang="en",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "owner_uploaded_english_with_region",
            ListYtdlpSubtitlesResult(
                subtitles=["fr", "en-US", "es"], automaticCaptions=["en", "fr"]
            ),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.Subtitles,
                lang="en-US",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "any_owner_uploaded",
            ListYtdlpSubtitlesResult(subtitles=["es"], automaticCaptions=["en", "fr"]),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.Subtitles,
                lang="es",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "ai_english",
            ListYtdlpSubtitlesResult(
                subtitles=[], automaticCaptions=["fr", "en", "es"]
            ),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.AutomaticCaptions,
                lang="en",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "any_ai_non_translated",
            ListYtdlpSubtitlesResult(
                subtitles=[], automaticCaptions=["fr-translated", "es", "en-translated"]
            ),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.AutomaticCaptions,
                lang="es",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "any_ai_subtitle",
            ListYtdlpSubtitlesResult(subtitles=[], automaticCaptions=["es-translated"]),
            "http://example.com/video",
            DownloadYtdlpSubtitlesRequest(
                video_url="http://example.com/video",
                sub_type=SubType.AutomaticCaptions,
                lang="es-translated",
                cookie_file_path="cookies.txt",
            ),
        ),
        (
            "no_subtitles_available",
            ListYtdlpSubtitlesResult(subtitles=[], automaticCaptions=[]),
            "http://example.com/video",
            None,
        ),
    ],
)
def test_choose_subtitle(name, subs, video_url, expected_req):
    req = choose_subtitle(subs, video_url)
    assert req == expected_req
