// 헤더 탭 (ALL + 카테고리)
export function headerTabsHTML(categories) {
  const allTab = "<li class='on'>ALL</li>";

  const categoryTabs = categories.map((category) => {
    return `<li>${category}</li>`;
  });

  const allTabs = [allTab, ...categoryTabs];
  return allTabs.join("");
}

// 카테고리 섹션/캐러셀 뼈대
export function createCategorySection(cate) {
  const section = document.createElement("section");
  section.className = "category";

  const h2 = document.createElement("h2");
  h2.textContent = cate;

  const wrap = document.createElement("div");
  wrap.className = "carousel";

  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel-btn prev";
  prevBtn.textContent = "‹";

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel-btn next";
  nextBtn.textContent = "›";

  const list = document.createElement("div");
  list.className = "cards";

  wrap.append(prevBtn, list, nextBtn);
  section.append(h2, wrap);
  return { section, list, prevBtn, nextBtn };
}

// 채널 카드
export function createChannelCard({ chN, imgUrl }) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="thumb" style="${imgUrl ? `background-image:url(${imgUrl})` : ""}"></div>
    <div class="name">${chN}</div>
  `;
  const delBtn = document.createElement("button");
  delBtn.className = "card-del";
  delBtn.innerHTML = "×";

  const editBtn = document.createElement("button");
  editBtn.className = "card-edit";
  editBtn.textContent = "✎";

  card.append(delBtn, editBtn);
  return { card, delBtn, editBtn };
}

// 수정 모달 템플릿
export function editModalHTML(target, categories, btnText = "수정 저장") {
  return `
    <div>
      <img id="edit_img" src="${target.imgUrl || ""}" alt="${target.chN}" width="60" />
      <button id="img_update_btn">이미지 업데이트</button>
      <div>
        <div>${target.chN}</div>
        <div>채널 ID: ${target.chI}</div>
      </div>
    </div>
    <div>
      <label>
        새 이름:
        <input id="edit_name" type="text" maxlength="10" value="${target.chN}" />
      </label>
    </div>
    <div>
      <label>
        카테고리:
        <select id="edit_cate">
          ${categories
            .map((c) => `<option value="${c}" ${c === target.cate ? "selected" : ""}>${c}</option>`)
            .join("")}
        </select>
      </label>
      <button id="updateBtn">${btnText}</button>
    </div>`;
}

// 채널 추가 검색 결과 템플릿
export function addResultHTML({ chName, chId, imgUrl, categories }) {
  return `
    <div>
      <img src="${imgUrl}" alt="${chName}" width="60" />
      <div>${chName}</div>
      <h3>채널 ID: ${chId}</h3>
    </div>
    <div>
      <button id="saveBtn">이 채널 저장하기</button>
      <select id="categorySelect">
        <option value="">카테고리 선택</option>
        ${categories.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>
    </div>`;
}
