// PSUT MailBox - student submission page
(function () {
  const { t, label } = window.I18n;
  const $ = (id) => document.getElementById(id);
  const form = $("mailForm");
  const errorBox = $("formError");
  const submitBtn = $("submitBtn");
  const OFFLINE_MSG = "Can't reach the PSUT MailBox server. Make sure start.bat is running, then try again.";

  $("year").textContent = new Date().getFullYear();

  function showError(msg) {
    errorBox.dataset.label = msg; errorBox.textContent = t(msg);
    errorBox.classList.add("show");
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function clearError() {
    errorBox.classList.remove("show");
    errorBox.textContent = "";
  }

  // Load categories & types from the server so both sides stay in sync.
  fetch("/api/meta")
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((meta) => {
      const seg = $("typeChips");
      meta.types.forEach((t, i) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "type";
        input.value = t;
        if (i === 0) input.checked = true;
        const span = document.createElement("span");
        window.I18n.label(span, t);
        label.append(input, span);
        seg.append(label);
      });
      const select = $("category");
      meta.categories.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        label(opt, c);
        select.append(opt);
      });
    })
    .catch(() => $("offline").classList.remove("hidden"));

  window.addEventListener('languagechange', () => {
    submitBtn.textContent = t(submitBtn.disabled ? 'Sending…' : 'Send message');
  });
  // Anonymous / named toggle
  function syncIdentity() {
    const named = form.querySelector('input[name="identity"]:checked').value === "named";
    $("namedFields").classList.toggle("show", named);
    $("anonNotice").classList.toggle("hidden", named);
  }
  form.querySelectorAll('input[name="identity"]').forEach((r) => r.addEventListener("change", syncIdentity));
  syncIdentity();

  $("message").addEventListener("input", (e) => {
    $("msgCount").textContent = e.target.value.length;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const typeInput = form.querySelector('input[name="type"]:checked');
    const anonymous = form.querySelector('input[name="identity"]:checked').value === "anonymous";
    const payload = {
      type: typeInput ? typeInput.value : "",
      category: $("category").value,
      subject: $("subject").value.trim(),
      message: $("message").value.trim(),
      anonymous,
      name: anonymous ? "" : $("name").value.trim(),
      studentId: anonymous ? "" : $("studentId").value.trim(),
      email: anonymous ? "" : $("email").value.trim(),
    };

    if (!payload.type) return showError(OFFLINE_MSG);
    if (!payload.category) return showError("Please choose a category.");
    if (payload.subject.length < 3) return showError("Please write a subject (at least 3 characters).");
    if (payload.message.length < 10) return showError("Please write a message (at least 10 characters).");
    if (!anonymous && payload.name.length < 2) return showError("Please enter your name, or choose Anonymous.");

    submitBtn.disabled = true;
    submitBtn.textContent = t("Sending…");
    try {
      let res;
      try {
        res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (_) {
        throw new Error(OFFLINE_MSG);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || OFFLINE_MSG);
      $("refNumber").textContent = data.ref;
      $("formCard").classList.add("hidden");
      $("successCard").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t("Send message");
    }
  });

  $("copyBtn").addEventListener("click", () => {
    const text = $("refNumber").textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    $("copyBtn").textContent = t("Copied");
    setTimeout(() => ($("copyBtn").textContent = t("Copy")), 1500);
  });

  $("newBtn").addEventListener("click", () => {
    form.reset();
    const first = form.querySelector('input[name="type"]');
    if (first) first.checked = true;
    $("msgCount").textContent = "0";
    syncIdentity();
    $("successCard").classList.add("hidden");
    $("formCard").classList.remove("hidden");
  });
})();
