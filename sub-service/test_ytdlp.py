from ytdlp import (
    download_ytdlp_subtitles,
    DownloadYtdlpSubtitlesRequest,
    list_ytdlp_subtitles,
    SubType,
)

import pytest
import os


def e2e_test_enable() -> bool:
    return os.getenv("E2E_TEST").lower() == "true"


@pytest.mark.skipif(not e2e_test_enable(), reason="E2E tests not enabled")
def test_list_ytdlp_subtitles_no_cookies():
    video_url = "https://www.youtube.com/watch?v=kJQP7kiw5Fk"

    res = list_ytdlp_subtitles(video_url, cookie_file_path=None)

    # automaticCaptions includes ai subtitles
    assert "en" in res.automaticCaptions
    # automaticCaptions includes ai translated subtitles
    assert "zh-Hans-en-eEY6OEpapPo" in res.automaticCaptions
    # subtitles includes owner uploaded subtitles with special naming
    assert "en-eEY6OEpapPo" in res.subtitles
    # subtitles includes owner uploaded subtitles
    assert "es" in res.subtitles


@pytest.mark.skipif(not e2e_test_enable(), reason="E2E tests not enabled")
@pytest.mark.parametrize(
    "sub_type, lang, expected_filename",
    [
        pytest.param(
            SubType.AutomaticCaptions, "en", "subtitle.en.vtt", id="ai-subtitles"
        ),
        pytest.param(
            SubType.AutomaticCaptions,
            "zh-Hans-en-eEY6OEpapPo",
            "subtitle.zh-Hans-en-eEY6OEpapPo.vtt",
            id="ai-translated-subtitles",
        ),
        pytest.param(
            SubType.Subtitles, "es", "subtitle.es.vtt", id="owner-uploaded-subtitles"
        ),
        pytest.param(
            SubType.Subtitles,
            "en-eEY6OEpapPo",
            "subtitle.en-eEY6OEpapPo.vtt",
            id="owner-uploaded-subtitles-special",
        ),
    ],
)
def test_download_ytdlp_subtitles_no_cookies(sub_type, lang, expected_filename):
    video_url = "https://www.youtube.com/watch?v=kJQP7kiw5Fk"

    req = DownloadYtdlpSubtitlesRequest(
        video_url=video_url,
        sub_type=sub_type,
        lang=lang,
        cookie_file_path=None,
    )
    result = download_ytdlp_subtitles(req)
    assert result == expected_filename
