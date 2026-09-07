window.DV2LivechatCompositions = {};

function getAuthHeaders() {
  var headers = {
    'Authorization': 'Bearer ' + DV2Livechat.privateKey,
    'Content-Type': 'application/json'
  };
  if (DV2Livechat.apiKey) {
    headers['X-API-Key'] = DV2Livechat.apiKey;
  }
  return headers;
}

function formatDate(d) {
  if (!d) return '—';
  var dt = new Date(d);
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function processLinks(text) {
  if (!text) return text;
  var result = text.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, function (match, before, url, after) {
    var attrs = before + after;
    if (/target\s*=/i.test(attrs)) {
      attrs = attrs.replace(/target\s*=\s*["'][^"']*["']/gi, 'target="_blank"');
    } else {
      attrs += ' target="_blank"';
    }
    if (/rel\s*=/i.test(attrs)) {
      attrs = attrs.replace(/rel\s*=\s*["'][^"']*["']/gi, 'rel="nofollow noopener"');
    } else {
      attrs += ' rel="nofollow noopener"';
    }
    return '<a ' + attrs.trim() + ' href="' + url + '">';
  });
  result = result.replace(/(^|[^"'>\/])(https?:\/\/[^\s<"']+)/gi, function (match, before, url) {
    var cleanUrl = url.replace(/[.,;:!?]+$/, '');
    if (cleanUrl.length < 5) return match;
    return before + '<a href="' + cleanUrl + '" target="_blank" rel="nofollow noopener">' + cleanUrl + '</a>';
  });
  return result;
}

// ─── useAuth ────────────────────────────────────────────────
DV2LivechatCompositions.useAuth = function () {
  var Vue = window.Vue;
  var authenticated = Vue.ref(false);
  var authError = Vue.ref('');
  var authLoading = Vue.ref(false);
  var siteData = Vue.ref(null);

  var verifyAuth = async function () {
    authLoading.value = true;
    authError.value = '';
    try {
      var res = await fetch(DV2Livechat.apiUrl + '/api/site/private', {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        var err = await res.json();
        throw new Error(err.message || 'Xác thực thất bại');
      }
      var data = await res.json();
      authenticated.value = true;
      siteData.value = data.site || data;
    } catch (e) {
      authError.value = e.message;
      authenticated.value = false;
    } finally {
      authLoading.value = false;
    }
  };

  return { authenticated: authenticated, authError: authError, authLoading: authLoading, siteData: siteData, verifyAuth: verifyAuth };
};

// ─── useSiteConfig ──────────────────────────────────────────
DV2LivechatCompositions.useSiteConfig = function () {
  var Vue = window.Vue;
  var currentVersion = Vue.ref(DV2Livechat.currentVersion || 1);
  var historyList = Vue.ref(DV2Livechat.historyVersions || []);

  var initial = DV2Livechat.initialConfig || {};
  var config = Vue.reactive({
    primary_color: initial.primary_color || '#007bff',
    chat_background: initial.chat_background || '#ffffff',
    sticky_message: initial.sticky_message || '',
    sticky_enabled: (initial.sticky_enabled === true || initial.sticky_enabled === 1 || initial.sticky_enabled === '1' || initial.sticky_enabled === 'true'),
    blocked_keywords: initial.blocked_keywords || [],
    hiddenChat: (initial.hiddenChat === true || initial.hiddenChat === 1 || initial.hiddenChat === '1' || initial.hiddenChat === 'true'),
    use_general_room: (initial.use_general_room === true || initial.use_general_room === 1 || initial.use_general_room === '1' || initial.use_general_room === 'true'),
    share_general_room: (initial.share_general_room === true || initial.share_general_room === 1 || initial.share_general_room === '1' || initial.share_general_room === 'true'),
    shared_group_id: initial.shared_group_id || '',
    allow_anonymous_chat: initial.allow_anonymous_chat !== undefined ? (initial.allow_anonymous_chat === true || initial.allow_anonymous_chat === 1 || initial.allow_anonymous_chat === '1' || initial.allow_anonymous_chat === 'true') : true,
    spam_config: Object.assign({ enabled: false, max_messages: 5, interval_seconds: 10, block_duration_minutes: 5 }, initial.spam_config || {}),
    ads_config: Object.assign({ start_time_minutes: 5, run_time_minutes: 10 }, initial.ads_config || {}),
    theme_mode: initial.theme_mode || 'light',
    css_overrides: initial.css_overrides || '',
    revive_instance_id: initial.revive_instance_id || '',
    revive_script_host: initial.revive_script_host || '',
    banner_zone_id: Object.assign({ '72890': '', '250250': '', 'topoutside': '', 'bottomoutside': '' }, initial.banner_zone_id || {}),
    banner_enabled: (initial.banner_enabled === true || initial.banner_enabled === 1 || initial.banner_enabled === '1' || initial.banner_enabled === 'true'),
    outside_enabled: (initial.outside_enabled === true || initial.outside_enabled === 1 || initial.outside_enabled === '1' || initial.outside_enabled === 'true'),
    theme_id: initial.theme_id || 'default',
    social_links: initial.social_links || []
  });
  var configSaving = Vue.ref(false);
  var configSaved = Vue.ref(false);

  var showRollbackModal = Vue.ref(false);
  var selectedRollbackVersion = Vue.ref(null);
  var rollbackLoading = Vue.ref(false);

  var applySiteData = function (site, historyData) {
    if (!site) return;
    var booleanFields = ['sticky_enabled', 'hiddenChat', 'use_general_room', 'share_general_room', 'allow_anonymous_chat', 'banner_enabled', 'outside_enabled'];
    Object.keys(config).forEach(function (k) {
      if (k === 'spam_config' && site.spam_config) {
        Object.assign(config.spam_config, site.spam_config);
      } else if (k === 'banner_zone_id' && site.banner_zone_id) {
        Object.assign(config.banner_zone_id, site.banner_zone_id);
      } else if (k === 'ads_config' && site.ads_config) {
        Object.assign(config.ads_config, site.ads_config);
      } else if (site[k] !== undefined) {
        if (booleanFields.indexOf(k) !== -1) {
          config[k] = (site[k] === true || site[k] === 1 || site[k] === '1' || site[k] === 'true');
        } else {
          config[k] = site[k];
        }
      }
    });
    if (site.setting_version) {
      currentVersion.value = Number(site.setting_version);
      var versionBadgeEl = document.getElementById('dv2-version-badge');
      if (versionBadgeEl) versionBadgeEl.textContent = 'V' + currentVersion.value;
    }
    if (Array.isArray(historyData)) {
      historyList.value = historyData;
    }
  };

  var loadConfig = async function () {
    try {
      var res = await fetch(DV2Livechat.apiUrl + '/api/site/private', {
        headers: getAuthHeaders()
      });
      if (!res.ok) return;
      var data = await res.json();
      var site = data.site || data;
      applySiteData(site, data.history);
    } catch (e) {
      console.error('loadConfig error:', e);
    }
  };

  var saveConfig = async function () {
    configSaving.value = true;
    configSaved.value = false;
    try {
      var body = {};
      var fields = ['primary_color', 'chat_background', 'sticky_message', 'sticky_enabled', 'blocked_keywords', 'hiddenChat', 'use_general_room', 'share_general_room', 'shared_group_id', 'allow_anonymous_chat', 'spam_config', 'ads_config', 'theme_mode', 'css_overrides', 'theme_id', 'social_links', 'revive_instance_id', 'revive_script_host', 'banner_zone_id', 'banner_enabled', 'outside_enabled'];

      fields.forEach(function (f) {
        if (config[f] !== undefined) {
          body[f] = JSON.parse(JSON.stringify(config[f]));
        }
      });

      if (body.social_links) {
        body.social_links = body.social_links.filter(function (item) {
          return item && item.icon && item.link;
        }).map(function (item) {
          return {
            icon: item.icon,
            link: item.link,
            label: item.label || ''
          };
        });
      }
      if (body.sticky_message) {
        body.sticky_message = processLinks(body.sticky_message);
      } else {
        body.sticky_message = '';
      }

      var formData = new FormData();
      formData.append('action', 'dv2_save_settings');
      formData.append('settings', JSON.stringify(body));

      var res = await fetch(DV2Livechat.ajaxUrl, {
        method: 'POST',
        body: formData
      });
      var json = await res.json();
      if (!json.success) throw new Error(json.data?.message || 'Lưu thất bại');

      if (json.data.active_version) {
        currentVersion.value = Number(json.data.active_version);
        var versionBadgeEl = document.getElementById('dv2-version-badge');
        if (versionBadgeEl) versionBadgeEl.textContent = 'V' + currentVersion.value;
      }
      if (json.data.settings) {
        applySiteData(json.data.settings, json.data.history);
      }
      if (json.data.history) {
        historyList.value = json.data.history;
      }

      configSaved.value = true;
      setTimeout(function () { configSaved.value = false; }, 3000);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      configSaving.value = false;
    }
  };

  var confirmRollback = function (versionItem) {
    selectedRollbackVersion.value = versionItem;
    showRollbackModal.value = true;
  };

  var executeRollback = async function () {
    if (!selectedRollbackVersion.value) return;
    rollbackLoading.value = true;
    try {
      var formData = new FormData();
      formData.append('action', 'dv2_rollback_setting_version');
      formData.append('target_version', selectedRollbackVersion.value.version);

      var res = await fetch(DV2Livechat.ajaxUrl, {
        method: 'POST',
        body: formData
      });
      var json = await res.json();
      if (!json.success) throw new Error(json.data?.message || 'Khôi phục thất bại');

      if (json.data.settings) {
        applySiteData(json.data.settings, json.data.history);
      }
      if (json.data.active_version) {
        currentVersion.value = Number(json.data.active_version);
        var versionBadgeEl = document.getElementById('dv2-version-badge');
        if (versionBadgeEl) versionBadgeEl.textContent = 'V' + currentVersion.value;
      }
      showRollbackModal.value = false;
      alert('Đã khôi phục thành công về phiên bản V' + currentVersion.value);
    } catch (e) {
      alert('Lỗi khôi phục: ' + e.message);
    } finally {
      rollbackLoading.value = false;
    }
  };

  var saveReviveConfig = async function () {
    await saveConfig();
  };

  var saveTextAdConfig = async function () {
    await saveConfig();
  };

  return {
    config: config,
    configSaving: configSaving,
    configSaved: configSaved,
    currentVersion: currentVersion,
    historyList: historyList,
    showRollbackModal: showRollbackModal,
    selectedRollbackVersion: selectedRollbackVersion,
    rollbackLoading: rollbackLoading,
    confirmRollback: confirmRollback,
    executeRollback: executeRollback,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    saveReviveConfig: saveReviveConfig,
    saveTextAdConfig: saveTextAdConfig
  };
};

// ─── useAds ─────────────────────────────────────────────────
DV2LivechatCompositions.useAds = function () {
  var Vue = window.Vue;
  var ads = Vue.ref([]);
  var adForm = Vue.reactive({ title: '', content: '', priority: 0, end_date: '' });
  var editingAd = Vue.ref(null);
  var showAdModal = Vue.ref(false);
  var showDeletePopup = Vue.ref(false);
  var deletingAd = Vue.ref(null);
  var adsPagination = Vue.reactive({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  var loadAds = async function (page) {
    try {
      var url = DV2Livechat.apiUrl + '/api/site/private/ads?page=' + (page || adsPagination.page) + '&pageSize=' + adsPagination.pageSize;
      var res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return;
      var data = await res.json();
      ads.value = data.data || [];
      if (data.meta && data.meta.pagination) {
        adsPagination.page = data.meta.pagination.page || 1;
        adsPagination.total = data.meta.pagination.total || 0;
        adsPagination.totalPages = data.meta.pagination.pageCount || 0;
      }
    } catch (e) {
      console.error('loadAds error:', e);
    }
  };

  var loadAdsPage = function (p) {
    if (p < 1) return;
    adsPagination.page = p;
    loadAds(p);
  };

  var adQuillInstance = null;

  var initAdEditor = function (content) {
    if (typeof Quill === 'undefined') return;
    if (adQuillInstance) {
      adQuillInstance.root.innerHTML = content || '';
      return;
    }
    var el = document.getElementById('quill-ad-modal');
    if (!el) return;
    adQuillInstance = new Quill('#quill-ad-modal', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic'],
          [{ color: [] }, { background: [] }],
          ['link'],
          [{ list: 'ordered' }, { list: 'bullet' }]
        ]
      }
    });
    adQuillInstance.root.innerHTML = content || '';
  };

  var openCreateAd = function () {
    editingAd.value = null;
    adForm.title = '';
    adForm.content = '';
    adForm.priority = 0;
    adForm.end_date = '';
    showAdModal.value = true;
    Vue.nextTick(function () { initAdEditor(''); });
  };

  var openEditAd = function (ad) {
    editingAd.value = ad;
    adForm.title = ad.title || '';
    adForm.content = ad.content || '';
    adForm.priority = ad.priority || 0;
    adForm.end_date = ad.end_date ? ad.end_date.slice(0, 10) : '';
    showAdModal.value = true;
    Vue.nextTick(function () { initAdEditor(ad.content || ''); });
  };

  var closeAdModal = function () {
    adQuillInstance = null;
    showAdModal.value = false;
    editingAd.value = null;
  };

  var getAdContent = function () {
    return adQuillInstance ? adQuillInstance.root.innerHTML : '';
  };

  var submitAd = async function () {
    if (!adForm.title.trim()) {
      alert('Tiêu đề không được để trống');
      return;
    }
    var body = {
      title: adForm.title.trim(),
      content: getAdContent(),
      priority: adForm.priority || 0,
      end_date: adForm.end_date || null
    };
    if (body.content) body.content = processLinks(body.content);
    try {
      var isEdit = editingAd.value;
      var url = DV2Livechat.apiUrl + '/api/site/private/ads' + (isEdit ? '/' + editingAd.value._id : '');
      var method = isEdit ? 'PUT' : 'POST';
      var res = await fetch(url, { method: method, headers: getAuthHeaders(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(isEdit ? 'Cập nhật thất bại' : 'Thêm thất bại');
      closeAdModal();
      await loadAds(adsPagination.page);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  var confirmDeleteAd = function (ad) {
    deletingAd.value = ad;
    showDeletePopup.value = true;
  };

  var closeDeletePopup = function () {
    showDeletePopup.value = false;
    deletingAd.value = null;
  };

  var deleteAd = async function () {
    if (!deletingAd.value) return;
    try {
      var res = await fetch(DV2Livechat.apiUrl + '/api/site/private/ads/' + deletingAd.value._id, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Xoá thất bại');
      closeDeletePopup();
      await loadAds(adsPagination.page);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  return { ads: ads, adForm: adForm, editingAd: editingAd, showAdModal: showAdModal, showDeletePopup: showDeletePopup, deletingAd: deletingAd, adsPagination: adsPagination, loadAds: loadAds, loadAdsPage: loadAdsPage, openCreateAd: openCreateAd, openEditAd: openEditAd, closeAdModal: closeAdModal, submitAd: submitAd, confirmDeleteAd: confirmDeleteAd, closeDeletePopup: closeDeletePopup, deleteAd: deleteAd };
};

// ─── useQuillJS ────────────────────────────────────────────
DV2LivechatCompositions.useQuillJS = function (containerId, onChange) {
  var quillInstance = null;
  var toolbar = [
    ['bold', 'italic'],
    [{ color: [] }, { background: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }]
  ];

  var init = function (content) {
    if (typeof Quill === 'undefined') return;
    if (quillInstance) {
      if (quillInstance.root.innerHTML !== content) {
        quillInstance.root.innerHTML = content || '';
      }
      return;
    }
    var el = document.getElementById(containerId);
    if (!el) return;
    quillInstance = new Quill('#' + containerId, {
      theme: 'snow',
      modules: { toolbar: toolbar }
    });
    quillInstance.root.innerHTML = content || '';

    quillInstance.on('text-change', function () {
      if (onChange) {
        onChange(quillInstance.root.innerHTML);
      }
    });
  };

  var getContent = function () {
    if (!quillInstance) return '';
    var text = quillInstance.getText().trim();
    if (!text && !quillInstance.root.querySelector('img, iframe, video, a')) {
      return '';
    }
    return quillInstance.root.innerHTML;
  };

  var setContent = function (html) {
    if (quillInstance && quillInstance.root.innerHTML !== html) {
      quillInstance.root.innerHTML = html || '';
    }
  };

  var destroy = function () {
    quillInstance = null;
  };

  return { init: init, getContent: getContent, setContent: setContent, destroy: destroy };
};

// ─── useCodeMirror ──────────────────────────────────────────
DV2LivechatCompositions.useCodeMirror = function (onChange) {
  var Vue = window.Vue;
  var cmInstance = null;

  var initEditor = function (id, value) {
    if (typeof CodeMirror === 'undefined') return;
    if (cmInstance) {
      if (cmInstance.getValue() !== value) {
        cmInstance.setValue(value || '');
      }
      return;
    }
    var el = document.getElementById(id);
    if (!el) return;
    cmInstance = CodeMirror.fromTextArea(el, {
      mode: 'css',
      lineNumbers: true,
      lineWrapping: true,
      height: '240px'
    });
    cmInstance.setValue(value || '');
    cmInstance.on('change', function () {
      cmInstance.save();
      if (onChange) {
        onChange(cmInstance.getValue());
      }
    });
  };

  var getValue = function () { return cmInstance ? cmInstance.getValue() : ''; };
  var setValue = function (val) {
    if (cmInstance && cmInstance.getValue() !== val) {
      cmInstance.setValue(val || '');
    }
  };
  var getCodemirror = function () { return cmInstance; };

  return { initEditor: initEditor, getValue: getValue, setValue: setValue, getCodemirror: getCodemirror };
};

// ─── Guide Sections data ────────────────────────────────────
// (initialized inside setup() to avoid undefined Vue at parse time)
var guideSectionsData = [
  {
    title: 'Tổng quan', open: true, body: [
      'Plugin tích hợp Livechat vào WordPress, cho phép quản lý cấu hình chat real-time ngay trong Dashboard.',
      ['Site ID: Mã định danh trang web', 'Private Key: Mã xác thực bảo mật', 'Shortcode: [dv2_livechat]']
    ]
  },
  {
    title: 'Màu chủ đạo', open: false, body: [
      'Tuỳ chỉnh màu chủ đạo của khung chat, bao gồm header, button, và các accent khác.'
    ]
  },
  {
    title: 'Tin nhắn ghim', open: false, body: [
      'Tin nhắn hệ thống hiển thị cố định trong khung chat. Hỗ trợ định dạng HTML với QuillJS.',
      ['Bold, Italic: In đậm, in nghiêng', 'Forecolor, Backcolor: Màu chữ, màu nền', 'Link: Chèn liên kết', 'List: Danh sách có thứ tự / không thứ tự']
    ]
  },
  {
    title: 'Ẩn chat & Phòng chung', open: false, body: [
      'Ẩn giao diện chat: Tắt hiển thị khung chat trên toàn bộ site.',
      'Sử dụng phòng chung: Cho phép người dùng chat trong phòng chung thay vì phòng riêng.'
    ]
  },
  {
    title: 'Chat ẩn danh', open: false, body: [
      'Cho phép người dùng chat mà không cần đăng nhập.'
    ]
  },
  {
    title: 'Chống Spam', open: false, body: [
      'Cấu hình giới hạn tin nhắn để chống spam.',
      ['Số tin nhắn tối đa: Số tin nhắn cho phép trong khoảng thời gian', 'Khoảng thời gian (giây): Thời gian kiểm tra', 'Thời gian chặn (phút): Thời gian khoá chat khi vượt quá giới hạn']
    ]
  },
  {
    title: 'Giao diện & CSS', open: false, body: [
      'Tuỳ chỉnh giao diện và CSS nâng cao.',
      ['Chế độ hiển thị: Sáng / Tối', 'CSS Overrides: Ghi đè CSS tuỳ chỉnh (sử dụng CodeMirror)']
    ]
  },
  {
    title: 'Quảng cáo Revive', open: false, body: [
      'Tích hợp Revive Ad Server để hiển thị banner quảng cáo trong khung chat.',
      ['Instance ID: ID instance Revive', 'Script Host: Đường dẫn host script Revive (ví du: https://yhdgvy.adjeraketje.nl/c-asyncjs.php)', 'Zone IDs: Mã zone cho từng kích thước banner']
    ]
  },
  {
    title: 'Quảng cáo Text', open: false, body: [
      'Quản lý quảng cáo dạng text hiển thị trong khung chat.',
      ['Tiêu đề: Tên quảng cáo', 'Nội dung: Soạn thảo nội dung HTML', 'Ưu tiên: Số càng cao hiển thị càng ưu tiên', 'Ngày hết hạn: Tự động ẩn sau ngày này']
    ]
  }
];

// ─── Vue 3 App ─────────────────────────────────────────────
(function () {
  if (typeof window.Vue === 'undefined') return;
  var Vue = window.Vue;
  var createApp = Vue.createApp;
  var ref = Vue.ref;
  var reactive = Vue.reactive;
  var onMounted = Vue.onMounted;
  var watch = Vue.watch;
  var nextTick = Vue.nextTick;

  var app = createApp({
    setup: function () {
      var auth = DV2LivechatCompositions.useAuth();
      var config = DV2LivechatCompositions.useSiteConfig();
      var ads = DV2LivechatCompositions.useAds();
      var quillSticky = DV2LivechatCompositions.useQuillJS('quill-sticky', function (html) {
        config.config.sticky_message = html;
      });
      var cm = DV2LivechatCompositions.useCodeMirror(function (val) {
        config.config.css_overrides = val;
      });
      var activeTab = ref('config');
      var adsSubTab = ref('banner');
      var guideSections = reactive(JSON.parse(JSON.stringify(guideSectionsData)));

      var themeOptions = [
        { value: 'default', label: 'Mặc định (Default)' },
        { value: 'default-dark-emerald', label: 'Default Dark Emerald' },
        { value: 'cyber-esports-betting', label: 'Cyber Esports & Live Betting' },
        { value: 'cyber-forest-green', label: 'Cyber Forest Green' },
        { value: 'cyber-yellow', label: 'Cyber Yellow' },
        { value: 'volcanic-orange', label: 'Volcanic Orange' },
        { value: 'sapphire-blue', label: 'Sapphire Blue' },
        { value: 'premium-luxury-betting', label: 'Premium Cyber Betting' },
        { value: 'light-glassmorphic', label: 'Light Glassmorphic' },
        { value: 'violet-indigo-glassmorphic', label: 'Premium Glassmorphic' },
        { value: 'football-live-stream', label: 'Football Live Stream' }
      ];

      var socialIconOptions = [
        { value: 'facebook', label: 'Facebook' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'zalo', label: 'Zalo' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'forum', label: 'Diễn đàn (Forum)' }
      ];

      var addSocialLink = function () {
        if (!config.config.social_links) {
          config.config.social_links = [];
        }
        if (config.config.social_links.length < 3) {
          config.config.social_links.push({ icon: 'facebook', link: '', label: '' });
        }
      };

      var removeSocialLink = function (index) {
        if (config.config.social_links) {
          config.config.social_links.splice(index, 1);
        }
      };

      onMounted(async function () {
        var loadEl = document.getElementById('dv2-loading');

        if (!DV2Livechat.privateKey) {
          if (loadEl) loadEl.style.display = 'none';
          return;
        }

        await auth.verifyAuth();
        if (auth.authenticated.value) {
          await config.loadConfig();
          await ads.loadAds();
          var nameEl = document.getElementById('site-name');
          if (nameEl) nameEl.textContent = auth.siteData.value?.name || DV2Livechat.siteId;
        }
        await nextTick();
        quillSticky.init(config.config.sticky_message);
        if (typeof CodeMirror !== 'undefined') {
          cm.initEditor('cm-css', config.config.css_overrides);
        }
        if (loadEl) loadEl.style.display = 'none';
      });

      watch(activeTab, async function (tab) {
        await nextTick();
        if (tab === 'config') {
          quillSticky.init(config.config.sticky_message);
          if (!cm.getValue()) {
            cm.initEditor('cm-css', config.config.css_overrides);
          } else {
            cm.setValue(config.config.css_overrides);
          }
        } else if (tab === 'ads' && DV2Livechat.privateKey) {
          ads.loadAds(ads.adsPagination.page);
        }
      });

      watch(function () { return config.config.sticky_message; }, function (val) {
        quillSticky.setContent(val || '');
      });

      var saveConfig = async function () {
        config.config.sticky_message = quillSticky.getContent();
        config.config.css_overrides = cm.getValue ? cm.getValue() : document.getElementById('cm-css')?.value || '';
        await config.saveConfig();
      };

      var showThemeLightbox = ref(false);
      var lightboxThemeId = ref('default');

      var getThemePreviewUrl = function (themeId) {
        if (!themeId) return '';
        var mode = config.config.theme_mode || 'dark';
        return DV2Livechat.apiUrl.replace(/\/+$/, '') + '/screenshots/' + themeId + '_' + mode + '.png';
      };

      var getThemeLabel = function (themeId) {
        var found = themeOptions.find(function (t) { return t.value === themeId; });
        return found ? found.label : themeId;
      };

      var openThemePreviewLightbox = function (themeId) {
        lightboxThemeId.value = themeId;
        showThemeLightbox.value = true;
      };

      var handlePreviewError = function (e) {
        e.target.src = DV2Livechat.apiUrl.replace(/\/+$/, '') + '/screenshots/default_dark.png';
      };

      return {
        authenticated: auth.authenticated,
        authError: auth.authError,
        authLoading: auth.authLoading,
        siteData: auth.siteData,
        config: config.config,
        configSaving: config.configSaving,
        configSaved: config.configSaved,
        currentVersion: config.currentVersion,
        historyList: config.historyList,
        showRollbackModal: config.showRollbackModal,
        selectedRollbackVersion: config.selectedRollbackVersion,
        rollbackLoading: config.rollbackLoading,
        confirmRollback: config.confirmRollback,
        executeRollback: config.executeRollback,
        loadConfig: config.loadConfig,
        saveConfig: saveConfig,
        saveReviveConfig: config.saveReviveConfig,
        saveTextAdConfig: config.saveTextAdConfig,

        adsSubTab: adsSubTab,
        ads: ads.ads,
        adForm: ads.adForm,
        editingAd: ads.editingAd,
        showAdModal: ads.showAdModal,
        showDeletePopup: ads.showDeletePopup,
        deletingAd: ads.deletingAd,
        adsPagination: ads.adsPagination,
        loadAds: ads.loadAds,
        loadAdsPage: ads.loadAdsPage,
        openCreateAd: ads.openCreateAd,
        openEditAd: ads.openEditAd,
        closeAdModal: ads.closeAdModal,
        submitAd: ads.submitAd,
        confirmDeleteAd: ads.confirmDeleteAd,
        closeDeletePopup: ads.closeDeletePopup,
        deleteAd: ads.deleteAd,
        activeTab: activeTab,
        guideSections: guideSections,
        formatDate: formatDate,
        themeOptions: themeOptions,
        socialIconOptions: socialIconOptions,
        addSocialLink: addSocialLink,
        removeSocialLink: removeSocialLink,
        showThemeLightbox: showThemeLightbox,
        lightboxThemeId: lightboxThemeId,
        getThemePreviewUrl: getThemePreviewUrl,
        getThemeLabel: getThemeLabel,
        openThemePreviewLightbox: openThemePreviewLightbox,
        handlePreviewError: handlePreviewError
      };
    }
  });

  app.mount('#dv2-livechat-app');
})();
