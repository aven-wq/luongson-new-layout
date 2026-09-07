const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./AppCore-BF7kuK_D.js","./livechat_plugin.css"])))=>i.map(i=>d[i]);
(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const n of t.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function c(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=c(e);fetch(e.href,t)}})();var v="modulepreload",b=function(h,a){return new URL(h,a).href},m={};const k=function(a,c,s){let e=Promise.resolve();if(c&&c.length>0){let l=function(r){return Promise.all(r.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const n=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),i=o?.nonce||o?.getAttribute("nonce");e=l(c.map(r=>{if(r=b(r,s),r in m)return;m[r]=!0;const u=r.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(s)for(let f=n.length-1;f>=0;f--){const p=n[f];if(p.href===r&&(!u||p.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${r}"]${g}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":v,u||(d.as="script"),d.crossOrigin="",d.href=r,i&&d.setAttribute("nonce",i),document.head.appendChild(d),u)return new Promise((f,p)=>{d.addEventListener("load",f),d.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${r}`)))})}))}function t(n){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=n,window.dispatchEvent(o),!o.defaultPrevented)throw n}return e.then(n=>{for(const o of n||[])o.status==="rejected"&&t(o.reason);return a().catch(t)})};function y(h,a){const c=new URL("livechat_plugin.css?v1787659355311",import.meta.url).href,s=document.createElement("link");if(s.setAttribute("rel","stylesheet"),s.setAttribute("href",c),h.appendChild(s),a&&a.parentNode){const e=s.cloneNode(!0);a.parentNode.insertBefore(e,a.nextSibling)}}function x(h="#livechat_app"){const a=document.querySelector(h);if(!a){console.log("No livechat-shortcode container found");return}const c=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=`
    @keyframes chatPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }
    .chat-skeleton-container {
      width: 100%;
      height: 100%;
      min-height: 480px;
      background: var(--chat-bg, #111);
      border: 1px solid var(--chat-border, #222);
      border-radius: var(--chat-radius, 12px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }
    .chat-skeleton-header {
      height: 52px;
      background: var(--chat-header-bg, #1a1a1a);
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--chat-border, #222);
    }
    .chat-skeleton-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--chat-input-bg, #333);
      animation: chatPulse 1.5s infinite ease-in-out;
      flex-shrink: 0;
    }
    .chat-skeleton-title {
      width: 100px;
      height: 14px;
      background: var(--chat-input-bg, #333);
      margin-left: 12px;
      border-radius: 3px;
      animation: chatPulse 1.5s infinite ease-in-out;
    }
    .chat-skeleton-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--chat-bg, #111);
      overflow: hidden;
      box-sizing: border-box;
    }
    .chat-skeleton-msg {
      display: flex;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
    }
    .chat-skeleton-msg-right {
      justify-content: flex-end;
    }
    .chat-skeleton-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--chat-input-bg, #222);
      animation: chatPulse 1.5s infinite ease-in-out;
      flex-shrink: 0;
    }
    .chat-skeleton-msg-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 70%;
      width: 100%;
    }
    .chat-skeleton-msg-left .chat-skeleton-msg-content {
      align-items: flex-start;
    }
    .chat-skeleton-msg-right .chat-skeleton-msg-content {
      align-items: flex-end;
    }
    .chat-skeleton-line {
      height: 14px;
      background: var(--chat-input-bg, #222);
      border-radius: 4px;
      animation: chatPulse 1.5s infinite ease-in-out;
    }
    .chat-skeleton-msg-left .chat-skeleton-line {
      background: var(--chat-input-bg, #222);
      border-bottom-left-radius: 2px;
    }
    .chat-skeleton-msg-right .chat-skeleton-line {
      background: var(--chat-primary, #eab308);
      opacity: 0.2;
      border-bottom-right-radius: 2px;
    }
    .chat-skeleton-footer {
      height: 52px;
      background: var(--chat-header-bg, #1a1a1a);
      border-top: 1px solid var(--chat-border, #222);
      padding: 8px 12px;
      display: flex;
      align-items: center;
    }
    .chat-skeleton-input {
      flex: 1;
      height: 32px;
      background: var(--chat-input-bg, #222);
      border-radius: 16px;
      animation: chatPulse 1.5s infinite ease-in-out;
    }
    /* Fallback Light Mode */
    :host([data-theme="light"]) .chat-skeleton-container,
    .chat-skeleton-container.light {
      --chat-bg: #fdfdfd;
      --chat-header-bg: #f3f4f6;
      --chat-border: #e5e7eb;
      --chat-input-bg: #e5e7eb;
      --chat-radius: 12px;
    }
  `,c.appendChild(s);let e="dark",t=null;try{const i=localStorage.getItem("livechat_theme_cache");if(i){const l=JSON.parse(i);e=l.themeMode||"dark",t=l.styles}else e=document.documentElement.getAttribute("data-theme")||"dark"}catch(i){console.error("Error reading cached theme:",i),e=document.documentElement.getAttribute("data-theme")||"dark"}e==="light"&&c.host.setAttribute("data-theme","light");const n=document.createElement("div");if(n.className=`chat-skeleton-container ${e}`,t)for(const i in t)n.style.setProperty(i,t[i]);n.innerHTML=`
    <div class="chat-skeleton-header">
      <div class="chat-skeleton-avatar"></div>
      <div class="chat-skeleton-title"></div>
    </div>
    <div class="chat-skeleton-body">
      <!-- Message Left -->
      <div class="chat-skeleton-msg chat-skeleton-msg-left">
        <div class="chat-skeleton-msg-avatar"></div>
        <div class="chat-skeleton-msg-content">
          <div class="chat-skeleton-line" style="width: 55%"></div>
          <div class="chat-skeleton-line" style="width: 35%"></div>
        </div>
      </div>
      <!-- Message Right -->
      <div class="chat-skeleton-msg chat-skeleton-msg-right">
        <div class="chat-skeleton-msg-content">
          <div class="chat-skeleton-line" style="width: 45%"></div>
        </div>
      </div>
      <!-- Message Left -->
      <div class="chat-skeleton-msg chat-skeleton-msg-left">
        <div class="chat-skeleton-msg-avatar"></div>
        <div class="chat-skeleton-msg-content">
          <div class="chat-skeleton-line" style="width: 65%"></div>
          <div class="chat-skeleton-line" style="width: 25%"></div>
        </div>
      </div>
    </div>
    <div class="chat-skeleton-footer">
      <div class="chat-skeleton-input"></div>
    </div>
  `,c.appendChild(n),y(c,a);const o=document.createElement("div");o.id="chat-core-root",o.style.height="100%",o.style.display="none",c.appendChild(o),k(async()=>{const{renderApp:i}=await import("./AppCore-BF7kuK_D.js");return{renderApp:i}},__vite__mapDeps([0,1]),import.meta.url).then(({renderApp:i})=>{i(o),n.remove(),s.remove(),o.style.display="block"}).catch(i=>{console.error("Failed to load livechat core application:",i);const l=n.querySelector(".chat-skeleton-loading-text");l&&(l.textContent="Lỗi kết nối. Vui lòng tải lại trang.",l.style.color="#ef4444");const r=n.querySelector(".chat-skeleton-spinner");r&&(r.style.display="none")})}x();
