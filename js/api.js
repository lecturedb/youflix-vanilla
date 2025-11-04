import { API_URL, GOOGLE_API, DATA_URL, DRIVE_SCOPE, LS_KEYS } from "./constants.js";

export async function channelInfo(chI, youtubeKey) {
  const fields =
    "items(id,snippet(title,description,thumbnails(medium(url))),statistics(viewCount,videoCount,subscriberCount),contentDetails(relatedPlaylists(uploads)))";
  const endPoint = `${API_URL}/channels?key=${youtubeKey}&id=${chI}&fields=${fields}&part=snippet,statistics,contentDetails`;
  return await fetch(endPoint).then((res) => res.json());
}

export async function playlist(playlistId, youtubeKey) {
  const maxResults = 6;
  const fields = "items(snippet(publishedAt,title,thumbnails(medium),resourceId(videoId)))";
  const playlistURL = `${API_URL}/playlistItems?key=${youtubeKey}&playlistId=${playlistId}&maxResults=${maxResults}&fields=${fields}&part=snippet`;
  return await fetch(playlistURL).then((res) => res.json());
}

export async function videoInfo(resourceId, youtubeKey) {
  const fields = "items(contentDetails(duration),statistics(viewCount,likeCount,commentCount))";
  const videoURL = `${API_URL}/videos?id=${resourceId}&key=${youtubeKey}&part=contentDetails,statistics&fields=${fields}`;
  return await fetch(videoURL).then((res) => res.json());
}

export async function channelInfo2(handle, youtubeKey) {
  const fields =
    "items(id,snippet(title,description,thumbnails(medium(url))),statistics(viewCount,videoCount,subscriberCount),contentDetails(relatedPlaylists(uploads)))";
  const endPoint = `${API_URL}/channels?key=${youtubeKey}&forHandle=${handle}&fields=${fields}&part=snippet,statistics,contentDetails`;
  return await fetch(endPoint).then((res) => res.json());
}

const DRIVE_FILE_ID = localStorage.getItem(LS_KEYS.DRIVE_FILE_ID) || "";

export async function fetchFromDrive(youtubeKey) {
  const res = await fetch(`${DATA_URL}/${DRIVE_FILE_ID}?alt=media&key=${youtubeKey}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Drive fetch 실패: ${res.status}`);
  const json = await res.json();
  return json;
}

let _tokenClient = null;
let _accessToken = null;
let _expiresAt = 0; // ms

// 1) GIS 초기화: 앱 시작 시 1회
export function initDriveAuth(scope = DRIVE_SCOPE) {
  if (!window.google?.accounts?.oauth2) throw new Error("GIS 스크립트를 먼저 로드하세요.");
  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: localStorage.getItem(LS_KEYS.OAUTH_CLIENT_ID) || "",
    scope,
    callback: onToken, // 토큰 저장
  });
}

function onToken(res) {
  _accessToken = res.access_token;
  const sec = typeof res.expires_in === "number" ? res.expires_in : 3600;
  _expiresAt = Date.now() + Math.max(0, sec - 60) * 1000; // 만료 60초 전까지 유효로 취급
}

function hasValidToken() {
  return !!_accessToken && Date.now() < _expiresAt;
}

// 내부: 토큰 보장 (만료 전이면 그대로, 아니면 팝업으로 재발급)
async function ensureToken() {
  if (hasValidToken()) return _accessToken; // ← 만료 전: 팝업 없이 바로 진행

  // 만료/없음이면 '항상' 동의 팝업으로 새 토큰 발급 (사용자 제스처 안에서 호출)
  await new Promise((resolve) => {
    _tokenClient.callback = (r) => {
      onToken(r);
      resolve();
    };
    _tokenClient.requestAccessToken({ prompt: "none" });
  });
  return _accessToken;
}

export async function updateDriveData(jsonString) {
  const token = await ensureToken();
  const url = `${GOOGLE_API}/upload/drive/v3/files/${DRIVE_FILE_ID}?uploadType=media`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: jsonString,
  });
  if (!res.ok) throw new Error(`Drive update 실패: ${res.status} ${await res.text()}`);
  return await res.json();
}
