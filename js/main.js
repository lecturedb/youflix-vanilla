import { fetchFromDrive, initDriveAuth } from "./api.js";
import { bindCarouselNav, fitCardsToInteger, observeListResize } from "./carousel.js";
import { CATEGORIES, LS_KEYS, SELECTORS } from "./constants.js";
import { syncItemHeights } from "./detail.js";
import { onDeleteClick, onEditClick, onSubmitClick, onThumbClick } from "./handlers.js";
import { createCategorySection, createChannelCard, headerTabsHTML } from "./template.js";
import { exportChannelData, importChannelData, maskKey, saveFileId } from "./util.js";

// 상수 처리
const categories = CATEGORIES;
const STORAGE_KEY = LS_KEYS.CHANNELS;
const YOUTUBE_API_KEY = LS_KEYS.YT_API_KEY;
const youtubeKey = localStorage.getItem(YOUTUBE_API_KEY) || "";
const driveId = localStorage.getItem(LS_KEYS.DRIVE_FILE_ID) || "";
const clientId = localStorage.getItem(LS_KEYS.OAUTH_CLIENT_ID) || "";

// 요소 선택
const container = document.querySelector(SELECTORS.container);
const header = document.querySelector(SELECTORS.headerTabs);
const headerEl = document.querySelector(SELECTORS.headerRoot);
const hamburgerBtn = headerEl.querySelector(SELECTORS.hamburger);
const menu = document.querySelector(SELECTORS.headerMenu);
const chModal = document.querySelectorAll(SELECTORS.modalContainer)[0];
const detailModal = document.querySelectorAll(SELECTORS.modalContainer)[1];
const form = document.querySelector(SELECTORS.addForm);
const input = document.querySelector(SELECTORS.addInput);
const result = document.querySelector(SELECTORS.addResult);
const keyForm = document.querySelector(SELECTORS.keyForm);
const keyInput = document.querySelector(SELECTORS.keyInput);
const exportBtn = document.querySelector(SELECTORS.exportBtn);
const importBtn = document.querySelector(SELECTORS.importBtn);
const chAddBtn = document.querySelector(SELECTORS.chAddBtn);
const fileIdBtn = document.querySelector(SELECTORS.fileIdBtn);

header.innerHTML = headerTabsHTML(categories);

exportBtn.addEventListener("click", async () => {
  await exportChannelData();
});
importBtn.addEventListener("click", () => importChannelData(STORAGE_KEY, () => mainRender("ALL")));
fileIdBtn.addEventListener("click", () => saveFileId(driveId, clientId, LS_KEYS));

window.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Google Drive OAuth...");
  try {
    initDriveAuth();
  } catch (e) {
    console.error("초기화 실패:", e);
  }
});
window.addEventListener("load", syncItemHeights);
window.addEventListener("resize", syncItemHeights);

container.innerHTML = `<p>데이터 로딩 중...</p>`;
let data = [];

if (!driveId?.trim() || !clientId?.trim()) {
  container.innerHTML = `
    <p>
      구글 드라이브 파일 ID 또는 OAuth 클라이언트 ID가 설정되어 있지 않습니다.<br>
      파일 ID 저장 버튼을 누르고 ID 를 입력해주세요.
    </p>
  `;
} else {
  try {
    data = await fetchFromDrive(youtubeKey);
    mainRender("ALL");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>데이터를 불러오지 못했습니다.</p>`;
  }
}

function mainRender(selected = "ALL") {
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `<p>저장된 채널이 없습니다.</p>`; // 채널 정보 없을 때 처리
    return;
  }
  const targetCategories = selected === "ALL" ? categories : [selected];

  targetCategories.forEach((cate) => {
    const items = data.filter((item) => item.cate === cate);
    if (items.length === 0) return;

    const { section, list, prevBtn, nextBtn } = createCategorySection(cate);

    const sorted = items.sort((a, b) => a.chN.localeCompare(b.chN, "ko"));

    sorted.forEach(({ chN, chI }) => {
      const { card, delBtn, editBtn } = createChannelCard({
        chN,
        imgUrl: null,
      });

      const thumb = card.querySelector(".thumb");
      const stored = items.find((d) => d.chI === chI);
      if (stored?.imgUrl) {
        thumb.style.backgroundImage = `url(${stored.imgUrl})`;
      }

      thumb.addEventListener("click", () => onThumbClick(chI, youtubeKey, detailModal));

      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // 썸네일 클릭/이동 이벤트 막기
        e.preventDefault();

        const next = await onDeleteClick(chN, chI, data);
        if (!next) return;

        data = next; // 전역 데이터도 갱신
        mainRender("ALL");
      });

      editBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const updated = await onEditClick(data, chI, youtubeKey, chModal, keyForm, form, result);
        if (!updated) return;

        data = updated; // 전역 데이터도 갱신
        mainRender("ALL");
      });

      card.querySelector(".name").addEventListener("click", () => {
        window.open(`https://www.youtube.com/channel/${chI}`, "_blank");
      });
      list.appendChild(card);
    });

    container.appendChild(section);

    fitCardsToInteger(list, { min: 100, max: 160, gap: 6 });

    const nav = bindCarouselNav(list, prevBtn, nextBtn);

    observeListResize(list, () => {
      nav.updateButtons();
    });
  });
}

header.addEventListener("click", (e) => {
  const li = e.target.closest("li");

  if (!li) return;

  header.querySelectorAll("li").forEach((n) => n.classList.remove("on"));
  li.classList.add("on");

  const selected = li.textContent.trim();
  mainRender(selected);
});

chAddBtn.addEventListener("click", () => {
  chModal.classList.add("show");
  keyForm.style.display = "";
  form.style.display = "";

  if (youtubeKey) {
    const masked = maskKey(youtubeKey);
    // youtubeKey.length > 10
    //   ? youtubeKey.slice(0, 6) + "*".repeat(youtubeKey.length - 10) + youtubeKey.slice(-4)
    //   : "*".repeat(youtubeKey.length);
    keyInput.value = masked;
    keyInput.dataset.realKey = youtubeKey; // 실제 키는 dataset에 저장
  }
});

chModal.addEventListener("click", (e) => {
  if (e.target === chModal) {
    chModal.classList.remove("show");
    result.innerHTML = "";
    input.value = "";
  }
});

detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) {
    detailModal.classList.remove("show");
    const iframe = document.getElementById("main_video_iframe");
    iframe.src = "about:blank";
    iframe.remove();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const onSaved = (updated) => {
    if (updated) {
      data = updated;
      mainRender("ALL"); // ← 저장 완료 시점에만 재렌더
    }
  };
  await onSubmitClick(input, result, youtubeKey, data, chModal, onSaved);
});

keyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const key = keyInput.value.trim();
  if (!key) {
    alert("API 키를 입력하세요.");
    return;
  }

  localStorage.setItem(YOUTUBE_API_KEY, key);
  alert("Youtube API 키가 저장되었습니다.");
});

hamburgerBtn.addEventListener("click", () => {
  const isOpen = headerEl.classList.toggle("open");
});

// 메뉴 클릭 시 자동 접기(선택 사항)
menu.addEventListener("click", (e) => {
  if (e.target.closest("li")) {
    headerEl.classList.remove("open");
  }
});
