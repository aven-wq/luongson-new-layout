// Tabs Module - Clean tab switching for schedule, servers, and categories
export function initTabs(containerSelector = '[data-tabs]') {
  const containers = document.querySelectorAll(containerSelector);

  containers.forEach((container) => {
    const tabs = container.querySelectorAll('[data-tab-target]');
    const contents = container.querySelectorAll('[data-tab-content]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = tab.getAttribute('data-tab-target');

        tabs.forEach((t) => t.classList.remove('is-active'));
        contents.forEach((c) => c.classList.remove('is-active'));

        tab.classList.add('is-active');
        const targetContent = container.querySelector(`[data-tab-content="${targetId}"]`);
        if (targetContent) {
          targetContent.classList.add('is-active');
        }
      });
    });
  });
}
