/**
 * LuongSon — BLV recruitment form AJAX submit.
 */
(function () {
  'use strict';

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setMessage(form, text, type) {
    var message = form.querySelector('.luongson-blv-form__message');
    if (!message) return;

    message.textContent = text;
    message.hidden = !text;
    message.classList.remove('is-success', 'is-error');

    if (type) {
      message.classList.add(type === 'success' ? 'is-success' : 'is-error');
    }
  }

  function setSubmitting(form, isSubmitting) {
    var button = form.querySelector('.luongson-blv-form__submit');
    if (!button) return;

    button.disabled = isSubmitting;
    button.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
  }

  function validateForm(form) {
    var config = window.luongsonBlvForm || {};
    var i18n = config.i18n || {};
    var fullName = form.querySelector('[name="full_name"]');
    var phone = form.querySelector('[name="phone"]');
    var email = form.querySelector('[name="email"]');
    var experience = form.querySelector('[name="experience"]');

    if (!fullName || !phone || !email || !experience) {
      return i18n.error || '';
    }

    if (!fullName.value.trim() || !phone.value.trim() || !email.value.trim() || !experience.value.trim()) {
      return i18n.required || '';
    }

    if (!isValidEmail(email.value.trim())) {
      return i18n.invalidEmail || '';
    }

    return '';
  }

  function handleSubmit(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var config = window.luongsonBlvForm || {};
    var i18n = config.i18n || {};
    var error = validateForm(form);

    if (error) {
      setMessage(form, error, 'error');
      return;
    }

    setMessage(form, '', '');
    setSubmitting(form, true);

    var formData = new FormData(form);
    formData.set('action', 'luongson_blv_form_submit');
    formData.set('nonce', config.nonce || '');

    fetch(config.ajaxUrl || '/wp-admin/admin-ajax.php', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.success) {
          form.reset();
          setMessage(
            form,
            (result.data.data && result.data.data.message) || i18n.success || '',
            'success'
          );
          return;
        }

        var message =
          (result.data && result.data.data && result.data.data.message) ||
          i18n.error ||
          '';
        setMessage(form, message, 'error');
      })
      .catch(function () {
        setMessage(form, i18n.error || '', 'error');
      })
      .finally(function () {
        setSubmitting(form, false);
      });
  }

  function initForm(form) {
    if (!form || form.__lsBlvFormInit) return;
    form.__lsBlvFormInit = true;
    form.addEventListener('submit', handleSubmit);
  }

  function initAll() {
    document.querySelectorAll('.luongson-blv-form').forEach(initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
