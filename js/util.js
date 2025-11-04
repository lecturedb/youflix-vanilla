export function formatCount(n) {
  const num = Number(n ?? 0);
  return num.toLocaleString("ko-KR");
}

export function formatDuration(iso) {
  // "PT48M11S" -> "48:11", "PT1H2M3S" -> "1:02:03"
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = Number(m[1] || 0);
  const mm = Number(m[2] || 0);
  const ss = Number(m[3] || 0);
  const parts = [];
  if (h) parts.push(String(h));
  parts.push(h ? String(mm).padStart(2, "0") : String(mm));
  parts.push(String(ss).padStart(2, "0"));
  return parts.join(":");
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function removeHashtags(str = "") {
  // 1. 해시태그 패턴 찾기
  // \B#: 단어 중간이 아닌 해시태그만
  // \w+: 해시태그 단어
  // (?!\d+$): 전부 숫자일 경우는 제외(lookahead)
  return str
    .replace(/\B#(?!\d+\b)[\w가-힣_]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 채널 데이터 내보내기
export async function exportChannelData() {
  try {
    const response = await fetch("./youflix-data.json");
    if (!response.ok) throw new Error("기본 데이터 파일을 불러올 수 없습니다.");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "youflix-data.json";
    a.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("기본 데이터를 다운로드하는 중 오류가 발생했습니다.");
  }
}

// 채널 데이터 불러오기
export function importChannelData(storageKey, onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();
    localStorage.setItem(storageKey, text);
    alert("데이터 가져오기가 완료되었습니다!");
    onDone?.();
  });

  input.click();
}

// 키 마스킹
export function maskKey(k) {
  if (!k) return "";
  return k.length > 10
    ? k.slice(0, 6) + "*".repeat(k.length - 10) + k.slice(-4)
    : "*".repeat(k.length);
}

export function saveFileId(driveId, clientId, LS_KEYS) {
  const newDriveId = prompt("Google Drive File ID 를 입력하세요.", maskKey(driveId) || "");
  if (newDriveId !== null) {
    const trimmed = newDriveId.trim();
    if (trimmed) {
      localStorage.setItem(LS_KEYS.DRIVE_FILE_ID, trimmed);
      alert("Drive File ID 저장 완료");
    } else {
      alert("Drive File ID가 비어 있습니다. 드라이브 접근이 제한됩니다.");
    }
  }

  const newClientId = prompt("OAuth Client ID 를 입력하세요.", maskKey(clientId) || "");
  if (newClientId !== null) {
    const trimmed = newClientId.trim();
    if (trimmed) {
      localStorage.setItem(LS_KEYS.OAUTH_CLIENT_ID, trimmed);
      alert("Client ID 저장 완료");
    } else {
      alert("Client ID가 비어 있습니다. 일부 기능이 제한됩니다.");
    }
  }
}
