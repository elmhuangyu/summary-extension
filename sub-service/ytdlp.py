from enum import Enum
from pydantic import BaseModel
from typing import Set

import logging
import os
import yt_dlp

logger = logging.getLogger(__name__)


class ListYtdlpSubtitlesResult(BaseModel):
    automaticCaptions: Set[str]
    subtitles: Set[str]


def list_ytdlp_subtitles(
    video_url: str, cookie_file_path: str | None = None
) -> ListYtdlpSubtitlesResult:
    """
    Lists available subtitles for a given video URL using yt-dlp.
    """
    ydl_opts = {
        "listsubtitles": True,
        "skip_download": True,
    }

    if cookie_file_path:
        ydl_opts["cookiefile"] = cookie_file_path

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        return ListYtdlpSubtitlesResult(
            automaticCaptions=info_dict["automatic_captions"].keys(),
            subtitles=info_dict["subtitles"].keys(),
        )


class SubType(str, Enum):
    AutomaticCaptions = "automatic_captions"
    Subtitles = "subtitles"


class DownloadYtdlpSubtitlesRequest(BaseModel):
    video_url: str
    sub_type: SubType
    lang: str
    cookie_file_path: str | None = None


def download_ytdlp_subtitles(req: DownloadYtdlpSubtitlesRequest) -> str:
    """
    Downloads subtitles for a given video URL using yt-dlp.

    return: the path to the downloaded subtitle file
    """

    ydl_opts = {
        "subtitleslangs": [req.lang],
        "skip_download": True,
        "outtmpl": "subtitle",
    }

    if req.cookie_file_path:
        ydl_opts["cookiefile"] = req.cookie_file_path

    if req.sub_type == SubType.AutomaticCaptions:
        ydl_opts["writeautomaticsub"] = True
    elif req.sub_type == SubType.Subtitles:
        ydl_opts["writesubtitles"] = True

    before = os.listdir()

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.extract_info(req.video_url, download=True)

    after = os.listdir()
    return [f for f in after if f not in before][0]
