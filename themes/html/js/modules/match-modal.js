// Match Info Modal Popover on hover - Pixel-perfect Framer Recreation
export function initMatchModal() {
  const popoverHtml = `
<div class="framer-iz7ZB match-info-popover-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.2, 0, 0.2, 1); transform: scale(0.96); transform-origin: top center;">
  <div class="framer-aojxv6" role="dialog" style="--corner-shape-fallback: 0.796; background-color: rgb(255, 255, 255); border-radius: 20px; box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.05); width: 384px; box-sizing: border-box; padding: 12px 12px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
    <!-- Tabs -->
    <div class="framer-ry4stz">
      <div class="framer-1an5e9x match-modal-tab active" data-tab="all" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(82, 125, 255); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-k00u1l" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(255, 255, 255);">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; --framer-text-color: var(--extracted-r6o4lv, rgb(255, 255, 255)); color: var(--extracted-r6o4lv, rgb(255, 255, 255));">Tất cả</p>
        </div>
      </div>
      <div class="framer-10mbhol match-modal-tab" data-tab="h1" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-9h3v1m" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 1</p>
        </div>
      </div>
      <div class="framer-1pmanb5 match-modal-tab" data-tab="h2" data-border="true" style="--border-bottom-width: 1px; --border-color: rgb(82, 125, 255); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgba(0, 0, 0, 0); border-radius: 20px; cursor: pointer; padding: 6px 12px; display: flex; align-items: center; justify-content: center; user-select: none;">
        <div class="framer-1907n8s" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 14px; --framer-font-weight: 700; color: rgb(0, 0, 0);">Hiệp 2</p>
        </div>
      </div>
    </div>

    <!-- Row 1: TL kiểm soát bóng -->
    <div class="framer-1trrpnw">
      <div class="framer-lw7m8o">
        <div class="framer-a2fbit" data-framer-component-type="RichTextContainer">
          <p class="framer-text stat-val-left-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">57%</p>
        </div>
        <div class="framer-1vv346m" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">TL kiểm soát bóng</p>
        </div>
        <div class="framer-vu2aff" data-framer-component-type="RichTextContainer">
          <p class="framer-text stat-val-right-possession" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">43%</p>
        </div>
      </div>
      <div class="framer-1amiahw">
        <div class="framer-wtawsi" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1q3228h stat-bar-left-possession" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 57%; transition: width 0.3s ease;"></div>
        </div>
        <div class="framer-1s49rqs" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1mov7wv stat-bar-right-possession" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 43%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    </div>

    <!-- Row 2: Phạt góc -->
    <div class="framer-bgrmuy">
      <div class="framer-1u6jvqj">
        <div class="framer-h1o2hv" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p>
        </div>
        <div class="framer-4rz9po" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Phạt góc</p>
        </div>
        <div class="framer-xx3myi" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p>
        </div>
      </div>
      <div class="framer-1feu85z">
        <div class="framer-178b2zo" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1x604t0" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div>
        </div>
        <div class="framer-17jdo00" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-aefbwd" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 3: Thẻ vàng -->
    <div class="framer-1587lao">
      <div class="framer-zss6fq">
        <div class="framer-1s3rb2t" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">2</p>
        </div>
        <div class="framer-puwrvi" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Thẻ vàng</p>
        </div>
        <div class="framer-13lnoht" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">0</p>
        </div>
      </div>
      <div class="framer-1aof70k">
        <div class="framer-1yjap8f" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-19t9a93" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 100%;"></div>
        </div>
        <div class="framer-1sexck6" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1hyr9sk" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 0%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 4: Sút bóng -->
    <div class="framer-yce0z5">
      <div class="framer-ty4t7c">
        <div class="framer-1a4u3ke" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">7</p>
        </div>
        <div class="framer-gac7m7" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút bóng</p>
        </div>
        <div class="framer-1t89efh" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">3</p>
        </div>
      </div>
      <div class="framer-x8jp9i">
        <div class="framer-183ar8d" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1cg1fl1" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 70%;"></div>
        </div>
        <div class="framer-1qu21oe" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1akp76q" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 30%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 5: Sút cầu môn -->
    <div class="framer-xjkbmx">
      <div class="framer-1sgrvud">
        <div class="framer-1dfupgd" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">4</p>
        </div>
        <div class="framer-b0in9n" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút cầu môn</p>
        </div>
        <div class="framer-1uj1trx" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">1</p>
        </div>
      </div>
      <div class="framer-1kb4wjn">
        <div class="framer-zwoy2" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1i0d3s5" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 80%;"></div>
        </div>
        <div class="framer-1ibb5np" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1hrpzha" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 20%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 6: Sút ngoài cầu môn -->
    <div class="framer-bl1n0r">
      <div class="framer-mdn5hv">
        <div class="framer-1v2yfmh" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">3</p>
        </div>
        <div class="framer-bvkwnl" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Sút ngoài cầu môn</p>
        </div>
        <div class="framer-sblwng" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">2</p>
        </div>
      </div>
      <div class="framer-4rigqm">
        <div class="framer-hi9vag" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-p7lsql" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 60%;"></div>
        </div>
        <div class="framer-14qr236" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1kqvqsm" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 40%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 7: Tấn công -->
    <div class="framer-11lb8cc">
      <div class="framer-1q9h07r">
        <div class="framer-d56ahn" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">19</p>
        </div>
        <div class="framer-dws4k8" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công</p>
        </div>
        <div class="framer-6tmamu" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">17</p>
        </div>
      </div>
      <div class="framer-ui41va">
        <div class="framer-11yx3jj" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1juwgxq" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 53%;"></div>
        </div>
        <div class="framer-va1nw0" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-o67ujt" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 47%;"></div>
        </div>
      </div>
    </div>

    <!-- Row 8: Tấn công nguy hiểm -->
    <div class="framer-nmrzbo">
      <div class="framer-1ibdxtk">
        <div class="framer-rozn0b" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; text-align: left; color: rgb(0, 0, 0);">23</p>
        </div>
        <div class="framer-ysnhtg" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTUwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 500; text-align: center; color: rgb(0, 0, 0);">Tấn công nguy hiểm</p>
        </div>
        <div class="framer-rt7wpv" data-framer-component-type="RichTextContainer">
          <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTcwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 13px; --framer-font-weight: 700; --framer-text-alignment: end; text-align: right; color: rgb(0, 0, 0);">8</p>
        </div>
      </div>
      <div class="framer-hlv9iz">
        <div class="framer-1n2ttzj" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-1fe3abr" style="background-color: rgb(0, 128, 255); border-radius: 20px; width: 74%;"></div>
        </div>
        <div class="framer-18b5mhn" style="background-color: rgb(204, 204, 204); border-radius: 8px;">
          <div class="framer-pp1e24" style="background-color: rgb(240, 36, 36); border-radius: 20px; width: 26%;"></div>
        </div>
      </div>
    </div>

  </div>
</div>
  `;

  // Create single instance in document body
  let portal = document.querySelector('.match-info-popover-portal');
  if (!portal) {
    const div = document.createElement('div');
    div.innerHTML = popoverHtml.trim();
    portal = div.firstElementChild;
    document.body.appendChild(portal);
  }

  const leftPossText = portal.querySelector('.stat-val-left-possession');
  const rightPossText = portal.querySelector('.stat-val-right-possession');
  const leftPossBar = portal.querySelector('.stat-bar-left-possession');
  const rightPossBar = portal.querySelector('.stat-bar-right-possession');
  const tabs = portal.querySelectorAll('.match-modal-tab');

  const tabData = {
    all: { leftText: '57%', rightText: '43%', leftWidth: '57%', rightWidth: '43%' },
    h1: { leftText: '70%', rightText: '30%', leftWidth: '70%', rightWidth: '30%' },
    h2: { leftText: '45%', rightText: '55%', leftWidth: '45%', rightWidth: '55%' }
  };

  function setTab(tabName) {
    tabs.forEach(t => {
      const isCur = t.getAttribute('data-tab') === tabName;
      const textEl = t.querySelector('p');
      if (isCur) {
        t.style.backgroundColor = 'rgb(82, 125, 255)';
        if (textEl) textEl.style.color = 'rgb(255, 255, 255)';
      } else {
        t.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        if (textEl) textEl.style.color = 'rgb(0, 0, 0)';
      }
    });

    const data = tabData[tabName] || tabData.all;
    if (leftPossText) leftPossText.textContent = data.leftText;
    if (rightPossText) rightPossText.textContent = data.rightText;
    if (leftPossBar) leftPossBar.style.width = data.leftWidth;
    if (rightPossBar) rightPossBar.style.width = data.rightWidth;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabName = tab.getAttribute('data-tab');
      setTab(tabName);
    });
  });

  let currentTrigger = null;
  let closeTimeout = null;

  function showPopover(trigger) {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }

    currentTrigger = trigger;
    portal.style.display = 'block';

    const rect = trigger.getBoundingClientRect();
    const modalWidth = 384;
    const modalHeight = portal.offsetHeight || 440;

    let left = rect.left + (rect.width / 2) - (modalWidth / 2);
    // Collision detection on horizontal edges
    if (left < 10) left = 10;
    if (left + modalWidth > window.innerWidth - 10) {
      left = window.innerWidth - modalWidth - 10;
    }

    let top = rect.bottom + 4;
    // If overflowing bottom, flip to top
    if (top + modalHeight > window.innerHeight - 10 && rect.top - modalHeight - 4 > 0) {
      top = rect.top - modalHeight - 4;
    }

    portal.style.left = `${left}px`;
    portal.style.top = `${top}px`;

    // Trigger transition
    requestAnimationFrame(() => {
      portal.style.opacity = '1';
      portal.style.transform = 'scale(1)';
    });
  }

  function hidePopover() {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
    }
    closeTimeout = setTimeout(() => {
      portal.style.opacity = '0';
      portal.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (portal.style.opacity === '0') {
          portal.style.display = 'none';
          currentTrigger = null;
        }
      }, 150);
    }, 120);
  }

  portal.addEventListener('mouseenter', () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
  });

  portal.addEventListener('mouseleave', () => {
    hidePopover();
  });

  // Attach hover events to all match badges
  function attachBadges() {
    const badges = document.querySelectorAll('.luongson-match-status-container, .framer-iz7ZB.framer-3i8edo, [data-framer-name="Tất cả"] .framer-oy32wj, .framer-j2pa5u-container .framer-iz7ZB');
    badges.forEach(badge => {
      const target = badge.closest('.framer-iz7ZB') || badge;
      target.style.cursor = 'pointer';

      target.addEventListener('mouseenter', () => {
        showPopover(target);
      });

      target.addEventListener('mouseleave', () => {
        hidePopover();
      });
    });
  }

  attachBadges();

  window.addEventListener('scroll', () => {
    if (portal.style.display !== 'none' && currentTrigger) {
      const rect = currentTrigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        portal.style.display = 'none';
        portal.style.opacity = '0';
        currentTrigger = null;
      } else {
        showPopover(currentTrigger);
      }
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (portal.style.display !== 'none' && currentTrigger) {
      showPopover(currentTrigger);
    }
  });
}
