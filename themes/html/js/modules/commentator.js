// Commentator Dropdown Selector - Pixel-perfect Framer Recreation
export function initCommentatorDropdown() {
  const dropdownHtml = `
<div class="framer-dil7X commentator-popover-portal" style="position: fixed; z-index: 99999; pointer-events: auto; display: none; opacity: 0; transform: translateY(-4px) scale(0.98); transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0, 0.8, 0.2, 1); transform-origin: top left;">
  <div class="framer-c71cur" data-border="true" role="dialog" style="--border-bottom-width: 1px; --border-color: rgba(0, 38, 90, 0.14); --border-left-width: 1px; --border-right-width: 1px; --border-style: solid; --border-top-width: 1px; background-color: rgb(255, 255, 255); border-radius: 12px; box-shadow: 0px 8px 20px 0px rgba(0, 25, 70, 0.18); width: 170px; padding: 6px; display: flex; flex-direction: column; gap: 2px; box-sizing: border-box;">
    
    <!-- Option 1: Lưu Bang -->
    <div class="framer-caa1bv commentator-option" data-commentator="Lưu Bang" data-avatar="./assets/images/Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png?width=400&amp;height=472" data-framer-name="Lưu Bang Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-tahklm" data-framer-name="Avatar Lưu Bang" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="472" src="./assets/images/Yg6nej34YPDDFet4CbXU48kB5MY_5b33b28e.png?width=400&amp;height=472" width="400" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 45.8% 41%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-hjt0uq" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Lưu Bang</p>
      </div>
    </div>

    <!-- Option 2: Gia Cát Lượng -->
    <div class="framer-1uakdm5 commentator-option" data-commentator="Gia Cát Lượng" data-avatar="./assets/images/ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png?width=587&amp;height=523" data-framer-name="Gia Cát Lượng Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-efylkb" data-framer-name="Avatar Gia Cát Lượng" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="523" src="./assets/images/ftE6EP9wNhOHQhEsRJCuIRV2uk_4ee7751d.png?width=587&amp;height=523" width="587" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.6% 11.9%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-1kzxccu" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Gia Cát Lượng</p>
      </div>
    </div>

    <!-- Option 3: Shelby -->
    <div class="framer-11ofke8 commentator-option" data-commentator="Shelby" data-avatar="./assets/images/wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg?width=240&amp;height=360" data-framer-name="Shelby Option" data-highlight="true" style="border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 5px 8px; box-sizing: border-box; transition: background-color 0.15s ease;">
      <div class="framer-1lnb1eh" data-framer-name="Avatar Shelby" style="border-radius: 100px; width: 24px; height: 24px; flex: none; overflow: hidden; position: relative;">
        <div class="ls-s4" data-framer-background-image-wrapper="true" style="position: absolute; inset: 0px; border-radius: inherit;">
          <img class="ls-s149" alt="" decoding="auto" height="360" src="./assets/images/wIKNhKyKJ9nlZZOnf2LaeteFjyk_f44a3706.jpg?width=240&amp;height=360" width="240" style="display: block; width: 100%; height: 100%; border-radius: inherit; object-position: 47.3% 26.6%; object-fit: cover;" />
        </div>
      </div>
      <div class="framer-khshqr" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv: rgb(16, 39, 70); flex: 1 0 0px; width: 1px; height: auto;">
        <p class="framer-text" dir="auto" style="--font-selector: R0Y7TW9tbyBUcnVzdCBTYW5zLTYwMA==; --framer-font-family: 'Momo Trust Sans', 'Momo Trust Sans Placeholder', sans-serif; --framer-font-size: 11px; --framer-font-weight: 600; --framer-text-color: var(--extracted-r6o4lv, rgb(16, 39, 70)); color: rgb(16, 39, 70); white-space: nowrap;">Shelby</p>
      </div>
    </div>

  </div>
</div>
  `;

  // Create single portal instance in DOM
  let portal = document.querySelector('.commentator-popover-portal');
  if (!portal) {
    const div = document.createElement('div');
    div.innerHTML = dropdownHtml.trim();
    portal = div.firstElementChild;
    document.body.appendChild(portal);
  }

  const options = portal.querySelectorAll('.commentator-option');
  options.forEach((opt) => {
    opt.addEventListener('mouseenter', () => {
      opt.style.backgroundColor = 'rgb(232, 245, 255)';
    });
    opt.addEventListener('mouseleave', () => {
      opt.style.backgroundColor = 'transparent';
    });
  });

  let activeTrigger = null;

  function openDropdown(trigger) {
    if (activeTrigger === trigger && portal.style.display !== 'none') {
      closeDropdown();
      return;
    }

    activeTrigger = trigger;
    portal.style.display = 'block';

    const rect = trigger.getBoundingClientRect();
    const dropdownWidth = 170;
    const dropdownHeight = portal.offsetHeight || 120;

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10;
    }
    if (left < 10) left = 10;

    let top = rect.bottom + 6;
    if (top + dropdownHeight > window.innerHeight - 10 && rect.top - dropdownHeight - 6 > 0) {
      top = rect.top - dropdownHeight - 6;
    }

    portal.style.left = `${left}px`;
    portal.style.top = `${top}px`;

    requestAnimationFrame(() => {
      portal.style.opacity = '1';
      portal.style.transform = 'translateY(0px) scale(1)';
    });
  }

  function closeDropdown() {
    portal.style.opacity = '0';
    portal.style.transform = 'translateY(-4px) scale(0.98)';
    setTimeout(() => {
      if (portal.style.opacity === '0') {
        portal.style.display = 'none';
        activeTrigger = null;
      }
    }, 150);
  }

  // Handle option selection
  options.forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const commentator = opt.getAttribute('data-commentator');
      const avatarSrc = opt.getAttribute('data-avatar');

      if (activeTrigger) {
        // Update name
        const textEl = activeTrigger.querySelector('.framer-pgnkcz p, .framer-text');
        if (textEl) {
          textEl.textContent = commentator;
        }

        // Update avatar image
        const imgEl = activeTrigger.querySelector('.framer-16bmefw img, [data-framer-name^="Avatar"] img');
        if (imgEl) {
          imgEl.src = avatarSrc;
        }

        // Update container data-framer-name
        const parentContainer = activeTrigger.closest('.framer-dil7X');
        if (parentContainer) {
          parentContainer.setAttribute('data-framer-name', commentator);
        }
      }

      closeDropdown();
    });
  });

  // Attach click listener to all commentator triggers
  function attachCommentatorTriggers() {
    const buttons = document.querySelectorAll('.luongson-match-commentator-container, .framer-dil7X .framer-l9nh29, .framer-dil7X[data-framer-name]');
    buttons.forEach((btn) => {
      const trigger = btn.classList.contains('framer-l9nh29') ? btn : (btn.querySelector('.framer-l9nh29') || btn);
      trigger.style.cursor = 'pointer';

      // Hover background styling
      trigger.addEventListener('mouseenter', () => {
        trigger.style.backgroundColor = 'rgb(0, 166, 255)';
      });
      trigger.addEventListener('mouseleave', () => {
        trigger.style.backgroundColor = 'rgb(0, 110, 219)';
      });

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDropdown(trigger);
      });
    });
  }

  attachCommentatorTriggers();

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (portal.style.display !== 'none' && !portal.contains(e.target) && (!activeTrigger || !activeTrigger.contains(e.target))) {
      closeDropdown();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && portal.style.display !== 'none') {
      closeDropdown();
    }
  });

  // Reposition / close on scroll
  window.addEventListener('scroll', () => {
    if (portal.style.display !== 'none' && activeTrigger) {
      const rect = activeTrigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        portal.style.display = 'none';
        portal.style.opacity = '0';
        activeTrigger = null;
      } else {
        openDropdown(activeTrigger);
      }
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (portal.style.display !== 'none' && activeTrigger) {
      openDropdown(activeTrigger);
    }
  });
}
