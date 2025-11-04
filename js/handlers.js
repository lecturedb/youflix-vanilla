import { channelInfo, channelInfo2, updateDriveData } from "./api.js";
import { CATEGORIES } from "./constants.js";
import { detailRender } from "./detail.js";
import { addResultHTML, editModalHTML } from "./template.js";

export function onThumbClick(chI, youtubeKey, detailModal) {
  try {
    detailModal.classList.add("show");
    detailRender(chI, youtubeKey);
  } catch (e) {
    console.error(e);
    alert("채널 정보를 불러오지 못했습니다.");
  }
}

export async function onDeleteClick(chN, chI, data) {
  const ok = confirm(`'${chN}' 채널을 삭제할까요?\n(되돌릴 수 없습니다)`);
  if (!ok) return;

  try {
    const next = data.filter((item) => item.chI !== chI);
    await updateDriveData(JSON.stringify(next));
    alert("선택하신 채널은 삭제되었습니다.");
    return next;
  } catch (err) {
    console.error(err);
    alert("삭제 중 문제가 발생했습니다.");
    return null;
  }
}

export function onEditClick(data, chI, youtubeKey, chModal, keyForm, form, result) {
  const target = data.find((it) => it.chI === chI);
  if (!target) return alert("수정 대상 채널을 찾을 수 없습니다.");

  // 채널 추가 모달 재활용
  chModal.classList.add("show");
  keyForm.style.display = "none";
  form.style.display = "none";

  result.innerHTML = editModalHTML(target, CATEGORIES, "수정 저장");

  const imgEl = document.getElementById("edit_img");
  const imgUpdateBtn = document.getElementById("img_update_btn");
  const state = { newImgUrl: target.imgUrl };

  imgUpdateBtn.addEventListener("click", async () => {
    const nextUrl = await onImageUpdateClick(youtubeKey, target, imgUpdateBtn);
    if (nextUrl) {
      state.newImgUrl = nextUrl;
      imgEl.src = nextUrl;
    }
  });

  const updateBtn = document.getElementById("updateBtn");
  const nameInput = document.getElementById("edit_name");
  const cateSelect = document.getElementById("edit_cate");

  return new Promise(
    (resolve) => {
      updateBtn.addEventListener("click", async () => {
        const updated = await onUpdateClick(
          data,
          nameInput,
          cateSelect,
          target,
          state.newImgUrl,
          chModal,
          result
        );
        resolve(updated || null);
      });
    },
    { once: true }
  );
}

async function onImageUpdateClick(youtubeKey, target, imgUpdateBtn) {
  try {
    if (!youtubeKey) {
      alert("저장된 YouTube API 키가 없습니다.");
      return;
    }
    imgUpdateBtn.disabled = true;
    imgUpdateBtn.textContent = "갱신 중…";

    const res = await channelInfo(target.chI, youtubeKey);
    const nextUrl = res?.items?.[0]?.snippet?.thumbnails?.medium?.url;

    if (!nextUrl) {
      alert("이미지 URL을 가져오지 못했습니다.");
      return;
    }

    return nextUrl;
  } catch (err) {
    console.error(err);
    alert("이미지 갱신 중 오류가 발생했습니다.");
    return null;
  } finally {
    imgUpdateBtn.disabled = false;
    imgUpdateBtn.textContent = "이미지 갱신";
  }
}

async function onUpdateClick(data, nameInput, cateSelect, target, newImgUrl, chModal, result) {
  try {
    const newName = (nameInput.value || "").trim();
    const newCate = cateSelect.value;

    if (!newName) return alert("이름을 입력하세요 (10자 이내).");
    if (!newCate) return alert("카테고리를 선택하세요!");

    // 이름 중복 체크(자기 자신 제외)
    const nameExists = data.some((it) => it.chN === newName && it.chI !== target.chI);
    if (nameExists) {
      return alert(`"${newName}" 이름으로 이미 등록된 채널이 있습니다.`);
    }

    // 실제 업데이트
    const updated = data.map((it) =>
      it.chI === target.chI ? { ...it, chN: newName, cate: newCate, imgUrl: newImgUrl } : it
    );

    try {
      await updateDriveData(JSON.stringify(updated));
      alert("수정이 완료되었습니다.");

      chModal.classList.remove("show");
      result.innerHTML = "";
      nameInput.value = "";

      return updated;
    } catch (e) {
      console.error(e);
      alert("데이터 업데이트 중 오류가 발생했습니다.");
      return null;
    }
  } catch (err) {
    console.error(err);
    alert("수정 중 오류가 발생했습니다.");
  }
}

export async function onSubmitClick(input, result, youtubeKey, data, chModal, onSaved) {
  result.innerHTML = "";

  let handle = (input.value || "").trim();
  if (!handle) return;
  if (!handle.startsWith("@")) handle = "@" + handle;

  result.textContent = "조회 중…";

  try {
    const res = await channelInfo2(handle, youtubeKey);
    if (!res.items?.length) {
      result.textContent = "채널을 찾을 수 없습니다.";
      return;
    }

    const item = res.items[0];
    const chName = item.snippet.title;
    const chId = item.id;
    const imgUrl = item.snippet.thumbnails.medium.url;

    result.innerHTML = addResultHTML({ chName, chId, imgUrl, categories: CATEGORIES });

    // 저장 버튼 기능 추가
    const saveBtn = document.getElementById("saveBtn");
    const categorySelect = document.getElementById("categorySelect");

    saveBtn.addEventListener(
      "click",
      async () => {
        const updated = await onSaveClick(
          data,
          chName,
          chId,
          imgUrl,
          categorySelect,
          chModal,
          input,
          result
        );
        if (updated) onSaved(updated);
      },
      { once: true }
    );
  } catch (err) {
    console.error(err);
    result.textContent = "오류가 발생했습니다.";
  }
}

async function onSaveClick(data, chName, chId, imgUrl, categorySelect, chModal, input, result) {
  try {
    const name = prompt("저장할 이름을 입력하세요 (10자 이내)", chName);
    if (!name) return alert("저장 취소됨");

    const cate = categorySelect.value;
    if (!cate) return alert("카테고리를 선택하세요!");

    const nameExists = data.some((item) => item.chN === name);
    const idExists = data.some((item) => item.chI === chId);

    if (nameExists) {
      alert(`"${name}" 이름으로 이미 등록된 채널이 있습니다.`);
      return;
    }
    if (idExists) {
      alert("이미 동일한 채널 ID가 저장되어 있습니다.");
      return;
    }

    try {
      const updated = [...data, { chN: name, chI: chId, cate, imgUrl }];
      await updateDriveData(JSON.stringify(updated));
      alert(`저장 완료!\n${name}: ${chId}`);
      chModal.classList.remove("show");
      return updated;
    } catch (e) {
      console.error(e);
      alert("데이터 업데이트 중 오류가 발생했습니다.");
    }
  } catch (e) {
    console.error(e);
    alert("저장 중 오류가 발생했습니다.");
    return null;
  } finally {
    input.value = "";
    result.textContent = "";
    input.focus();
  }
}
