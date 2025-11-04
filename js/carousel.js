export function fitCardsToInteger(listEl, { min = 130, max = 170, gap = 6 } = {}) {
  const W = listEl.clientWidth;
  if (!W) return;

  let N = Math.max(1, Math.floor((W + gap) / (min + gap)));
  let w = Math.floor((W - (N - 1) * gap) / N);

  while (w > max) {
    N += 1;
    w = Math.floor((W - (N - 1) * gap) / N);
  }

  while (N > 1 && w < min) {
    N -= 1;
    w = Math.floor((W - (N - 1) * gap) / N);
  }

  listEl.style.setProperty("--card-w", `${w}px`);
}

export function observeListResize(listEl, onResize) {
  const ro = new ResizeObserver(() => {
    fitCardsToInteger(listEl);
    onResize?.(); // 페이지/버튼 상태도 함께 갱신
  });
  ro.observe(listEl);
}

export function bindCarouselNav(listEl, prevBtn, nextBtn) {
  const step = () => listEl.clientWidth; // 한 화면(가시 영역) 폭
  const max = () => Math.max(0, listEl.scrollWidth - step()); // 스크롤 가능한 최대값
  const EPS = 1; // 부동소수 오차 여유

  const atStart = () => listEl.scrollLeft <= EPS;
  const atEnd = () => listEl.scrollLeft >= max() - EPS;

  function updateButtons() {
    prevBtn.disabled = atStart();
    nextBtn.disabled = atEnd();
  }

  function scrollByPages(delta) {
    const target = Math.max(0, Math.min(max(), listEl.scrollLeft + delta * step()));
    listEl.scrollTo({ left: target, behavior: "smooth" });
  }

  prevBtn.addEventListener("click", () => scrollByPages(-1));
  nextBtn.addEventListener("click", () => scrollByPages(1));

  listEl.addEventListener("scroll", updateButtons);

  updateButtons();

  return { updateButtons, scrollByPages };
}
