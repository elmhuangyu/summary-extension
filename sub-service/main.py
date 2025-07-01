from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.responses import PlainTextResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List
from urllib.parse import urlparse, parse_qs
from ytdlp import (
    download_ytdlp_subtitles,
    DownloadYtdlpSubtitlesRequest,
    list_ytdlp_subtitles,
    ListYtdlpSubtitlesResult,
    SubType,
)

import cachetools
import logging
import os
import tempfile
import threading

logger = logging.getLogger(__name__)

cache = cachetools.LRUCache(maxsize=100)
cache_lock = threading.Lock()

bearer_token = os.getenv("BEARER_TOKEN")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup event
    if not bearer_token:
        logger.warning("BEARER_TOKEN environment variable not set.")
    yield
    # Shutdown event (optional, if needed)


app = FastAPI(lifespan=lifespan)

# Define a security scheme for Bearer token
security = HTTPBearer()


class Cookies(BaseModel):
    domain: str
    includeSubdomains: bool
    path: str
    secure: bool
    expiry: int
    name: str
    value: str


class SubtitleRequest(BaseModel):
    video_url: str
    cookies: list[Cookies] = []


async def verify_bearer_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Verifies the bearer token against the BEARER_TOKEN environment variable.
    """

    if not bearer_token:
        return credentials.credentials

    if credentials.credentials != bearer_token:
        raise HTTPException(status_code=401, detail="Invalid bearer token.")
    return credentials.credentials


@app.post("/subtitles")
async def get_subtitles(
    request: SubtitleRequest, _: str = Depends(verify_bearer_token)
):
    """
    Downloads subtitles for a given YouTube or Bilibili video URL.
    """
    
    video_url = request.video_url
    cookies = request.cookies

    if video_url == "":
        raise HTTPException(status_code=400, detail="video_url is required.")

    site, video_id = extract_site_and_video_id(video_url)
    cache_key = f"{site}:{video_id}"

    with cache_lock:
        if cache_key in cache:
            return PlainTextResponse(content=cache[cache_key])

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)

            # write the cookies file
            convert_cookies_to_netscape_format(cookies)

            # bilibili has ai-zh only
            downloadReq = DownloadYtdlpSubtitlesRequest(
                video_url=video_url,
                sub_type=SubType.Subtitles,
                lang="ai-zh",
                cookie_file_path="cookies.txt",
            )

            if site == "youtube":
                # list sub
                subs = list_ytdlp_subtitles(video_url)

                if len(subs.subtitles) == 0 and len(subs.automaticCaptions) == 0:
                    raise HTTPException(
                        status_code=404, detail="No subtitles found for this video."
                    )

                downloadReq = choose_subtitle(subs, video_url)

            subtitle_filename = download_ytdlp_subtitles(downloadReq)
            if subtitle_filename == "":
                raise "fail to download subtitle"

            subtitle_content = ""
            with open(subtitle_filename, "r") as file:
                subtitle_content = file.read()

                with cache_lock:
                    cache[cache_key] = subtitle_content

            return PlainTextResponse(content=subtitle_content)

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def extract_site_and_video_id(url: str):
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname

    site = None
    video_id = None

    if "youtube.com" in hostname or "youtu.be" in hostname:
        site = "youtube"
        if "v=" in parsed_url.query:
            video_id = parse_qs(parsed_url.query).get("v", [None])[0]
        elif "youtu.be" in hostname:
            video_id = parsed_url.path.strip("/")
    elif "bilibili.com" in hostname:
        site = "bilibili"
        # Bilibili video IDs are typically in the path, e.g., /video/BV1xx411c7xx
        # or /video/avXXXXXX
        path_parts = parsed_url.path.split("/")
        if len(path_parts) >= 3 and path_parts[1] == "video":
            video_id = path_parts[2]
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported site. Only YouTube and Bilibili are supported.",
        )

    if not video_id:
        raise HTTPException(
            status_code=400, detail=f"Could not extract video ID from URL for {site}."
        )

    return site, video_id


def convert_cookies_to_netscape_format(
    cookies: List[Cookies], filename: str = "cookies.txt"
):
    """
    Converts a list of Pydantic Cookies objects to Netscape cookie file format
    and writes them to the specified file.
    """
    with open(filename, "w") as f:
        # Write the header
        f.write("# Netscape HTTP Cookie File\n")
        f.write("# This is a generated file! Do not edit.\n\n")

        for cookie in cookies:
            # Determine the includeSubdomains flag (TRUE/FALSE)
            # The Netscape format uses "TRUE" for includeSubdomains, "FALSE" otherwise.
            flag = "TRUE" if cookie.includeSubdomains else "FALSE"

            # Determine the secure flag (TRUE/FALSE)
            secure_flag = "TRUE" if cookie.secure else "FALSE"

            # Construct the line for the cookie
            # Fields are separated by tabs
            line_parts = [
                cookie.domain,
                flag,
                cookie.path,
                secure_flag,
                str(cookie.expiry),  # Expiry must be a string
                cookie.name,
                cookie.value,
            ]
            f.write("\t".join(line_parts) + "\n")


def choose_subtitle(
    list: ListYtdlpSubtitlesResult, video_url: str, cookies: str = "cookies.txt"
) -> DownloadYtdlpSubtitlesRequest:
    # always choose owner uploaded english subtitle if exists
    for sub in list.subtitles:
        if sub.startswith("en-") or sub == "en":
            return DownloadYtdlpSubtitlesRequest(
                video_url=video_url,
                sub_type=SubType.Subtitles,
                lang=sub,
                cookie_file_path=cookies,
            )

    # then any owner uploaded subtitle
    if len(list.subtitles) > 0:
        return DownloadYtdlpSubtitlesRequest(
            video_url=video_url,
            sub_type=SubType.Subtitles,
            lang=list.subtitles.pop(),
            cookie_file_path=cookies,
        )

    # then ai english subtitle
    if "en" in list.automaticCaptions:
        return DownloadYtdlpSubtitlesRequest(
            video_url=video_url,
            sub_type=SubType.AutomaticCaptions,
            lang="en",
            cookie_file_path=cookies,
        )

    # then any ai non-translated subtitle
    for sub in list.automaticCaptions:
        if "-" not in sub:
            return DownloadYtdlpSubtitlesRequest(
                video_url=video_url,
                sub_type=SubType.AutomaticCaptions,
                lang=sub,
                cookie_file_path=cookies,
            )

    # any ai subtitle
    if len(list.automaticCaptions) > 0:
        return DownloadYtdlpSubtitlesRequest(
            video_url=video_url,
            sub_type=SubType.AutomaticCaptions,
            lang=list.automaticCaptions.pop(),
            cookie_file_path=cookies,
        )
