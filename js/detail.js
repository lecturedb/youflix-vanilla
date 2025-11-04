import { channelInfo, playlist, videoInfo } from "./api.js";
import { formatDate, formatDuration, formatCount, escapeHtml, removeHashtags } from "./util.js";

// 요소 선택
const mainVideoEl = document.querySelector("#main_video");
const videoMetaEl = document.querySelector("#video_meta");
const channelInfoEl = document.querySelector("#channel_info");
const playListEl = document.querySelector("#playlist div");

export async function detailRender(chId, youtubeKey) {
  mainVideoEl.innerHTML = "";
  videoMetaEl.innerHTML = "";
  channelInfoEl.innerHTML = "";
  playListEl.innerHTML = "";

  const channel = await channelInfo(chId, youtubeKey);
  renderChannelInfo(channel.items[0]);

  const {
    contentDetails: {
      relatedPlaylists: { uploads: playlistId },
    },
  } = channel.items[0];

  const list = await playlist(playlistId, youtubeKey);
  const videoLists = list.items ?? [];

  const videos = [];
  for (let i = 0; i < videoLists.length; i++) {
    const v = videoLists[i];
    const {
      snippet: {
        title,
        resourceId: { videoId },
      },
    } = v;

    const vD = await videoInfo(videoId, youtubeKey);
    const videoData = {
      videoId: v.snippet?.resourceId?.videoId,
      title: v.snippet?.title,
      thumb: v.snippet?.thumbnails?.medium?.url,
      publishedAt: v.snippet?.publishedAt,
      duration: vD.items[0].contentDetails?.duration,
      views: vD.items[0].statistics?.viewCount,
      likes: vD.items[0].statistics?.likeCount,
      comments: vD.items[0].statistics?.commentCount,
    };
    videos.push(videoData);
  }

  renderPlaylist(videos);
  renderMainVideo(videos[0]);
  renderMeta(videos[0]);
}

// 메인 비디오 렌더링
function renderMainVideo(video) {
  if (!video) return;
  mainVideoEl.innerHTML = `
    <iframe
      id="main_video_iframe"
      width="100%" height="100%"
      src="https://www.youtube.com/embed/${video.videoId}"
      title="${escapeHtml(video.title)}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  `;
}

// 메인 비디오 메타 정보 렌더링
function renderMeta(video) {
  if (!video) return;
  videoMetaEl.innerHTML = `
    <div class="meta-title">${escapeHtml(video.title)}</div>
    <div class="meta-sub">
      업로드: ${formatDate(video.publishedAt)}<br/>
      재생시간: ${formatDuration(video.duration)}<br/>
      조회수: ${formatCount(video.views)}<br/>
      좋아요: ${formatCount(video.likes)}<br/>
      댓글: ${formatCount(video.comments)}<br/>
    </div>
  `;
}

// 채널 정보 렌더링
function renderChannelInfo(ch) {
  const s = ch.snippet;
  const st = ch.statistics;
  const tn = s.thumbnails?.medium?.url;
  const chUrl = `https://www.youtube.com/channel/${ch.id}`;

  channelInfoEl.innerHTML = `
    <div class="channel-row">
      <a class="channel-link" href="${chUrl}" target="_blank" rel="noopener noreferrer">
        <img class="channel-avatar" src="${tn}" alt="채널 썸네일" />
      </a>
      <div>
        <div class="channel-title">${escapeHtml(s.title)}</div>
        <div class="channel-stats">
          영상 개수: ${formatCount(st.videoCount)}<br/>
          구독자 수: ${formatCount(st.subscriberCount)}<br/>
          총 조회수: ${formatCount(st.viewCount)}<br/>
        </div>
      </div>
    </div>
    <div class="channel-desc">${escapeHtml(s.description)}</div>
  `;
}

// 재생 목록 렌더링
function renderPlaylist(list) {
  playListEl.innerHTML = "";
  list.forEach((v) => {
    const title = escapeHtml(removeHashtags(v.title));
    const item = document.createElement("article");
    item.className = "item";
    item.innerHTML = `
      <div class="thumb_detail" data-title="${title}">
        <img src="${v.thumb}" alt="" />
      </div>
      <div class="item-meta">
        <div class="item-title">${title}</div>
        <div class="item-sub">
          업로드일: ${formatDate(v.publishedAt)}<br/>
          재생시간: ${formatDuration(v.duration)}<br/>
          조회 수: ${formatCount(v.views)}<br/>
          좋아요 수: ${formatCount(v.likes)}<br/>
          댓글 수: ${formatCount(v.comments)}<br/>
        </div>
      </div>
    `;
    item.addEventListener("click", () => {
      renderMainVideo(v);
      renderMeta(v);
    });
    playListEl.appendChild(item);
  });
}

export function syncItemHeights() {
  document.querySelectorAll(".item").forEach((item) => {
    const thumb = item.querySelector(".thumb_detail");
    if (!thumb) return;

    const h = thumb.getBoundingClientRect().height;
    item.style.setProperty("--item-h", `${h}px`);
  });
}
