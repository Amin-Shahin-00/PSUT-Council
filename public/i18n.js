(() => {
  const dictionary = {
    'MailBox': 'صندوق البريد', 'MailBox · Council': 'صندوق بريد المجلس',
    'Council login': 'دخول المجلس', 'Student site': 'صفحة الطلاب', 'Log out': 'تسجيل الخروج',
    'Student Council · Princess Sumaya University for Technology': 'مجلس الطلبة · جامعة الأميرة سمية للتكنولوجيا',
    'Say it plainly.': 'صوتك مهم.', "We're listening.": 'نحن نستمع إليك.',
    'Use this form to send a complaint, note or suggestion to the Student Council. You can include your name, or send it anonymously.': 'أرسل شكوى أو ملاحظة أو اقتراحاً إلى مجلس الطلبة. يمكنك ذكر اسمك أو الإرسال دون الكشف عن هويتك.',
    'Choose': 'اختر', 'Write': 'اكتب', 'Track': 'تابع', 'Privacy': 'الخصوصية',
    'Pick the category that fits. This sends your message to the right council member.': 'اختر التصنيف المناسب لتصل رسالتك إلى عضو المجلس المعني.',
    'Include details: course codes, buildings, dates. The more specific, the faster we can act.': 'اذكر التفاصيل مثل رمز المساق والمبنى والتاريخ. التفاصيل الواضحة تساعدنا على معالجة رسالتك بسرعة.',
    "You'll get a reference number to quote if you follow up with the council.": 'ستحصل على رقم مرجعي يمكنك استخدامه عند المتابعة مع المجلس.',
    'Anonymous messages store no name, student ID, email or IP address.': 'الرسائل مجهولة الهوية لا تحفظ الاسم أو الرقم الجامعي أو البريد الإلكتروني أو عنوان الإنترنت.',
    'New message': 'رسالة جديدة', 'Fields marked * are required.': 'الحقول المعلّمة بنجمة * مطلوبة.',
    'Type *': 'نوع الرسالة *', 'Category *': 'التصنيف *', 'Subject *': 'الموضوع *', 'Message *': 'الرسالة *', 'Send as *': 'الإرسال باسم *',
    'Select a category': 'اختر التصنيف', 'One line summary': 'ملخص في سطر واحد',
    'Describe what happened, where and when.': 'اشرح ما حدث وأين ومتى.',
    'Anonymous': 'مجهول الهوية', 'With my name': 'باسمي',
    'The council will not know who sent this message.': 'لن يعرف المجلس هوية مرسل هذه الرسالة.',
    'Full name *': 'الاسم الكامل *', 'Student ID': 'الرقم الجامعي', 'Email': 'البريد الإلكتروني', '(optional)': '(اختياري)',
    'Messages go straight to the Student Council inbox.': 'تصل الرسائل مباشرة إلى بريد مجلس الطلبة.',
    'Send message': 'إرسال الرسالة', 'Sending…': 'جارٍ الإرسال…', 'Message sent': 'تم إرسال الرسالة',
    'The Student Council has received your message. Save this reference number if you want to follow up later.': 'استلم مجلس الطلبة رسالتك. احتفظ بهذا الرقم المرجعي للمتابعة لاحقاً.',
    'Reference': 'الرقم المرجعي', 'Copy': 'نسخ', 'Copied': 'تم النسخ', 'Send another message': 'إرسال رسالة أخرى',
    'PSUT Student Council': 'مجلس طلبة جامعة الأميرة سمية',
    'Princess Sumaya University for Technology · Amman, Jordan': 'جامعة الأميرة سمية للتكنولوجيا · عمّان، الأردن',
    'Council sign in': 'تسجيل دخول المجلس', 'Only Student Council members can view submissions.': 'يمكن لأعضاء مجلس الطلبة فقط الاطلاع على الرسائل.',
    'Password': 'كلمة المرور', 'Sign in': 'تسجيل الدخول', 'Mailbox': 'صندوق البريد',
    'All messages': 'جميع الرسائل', 'New': 'جديدة', 'In review': 'قيد المراجعة', 'In Review': 'قيد المراجعة', 'Resolved': 'تم الحل', 'Dismissed': 'مغلقة',
    'of': 'من أصل', 'messages sent anonymously': 'رسائل أُرسلت دون اسم',
    'Showing 0 messages': 'عدد الرسائل: 0', 'Refresh': 'تحديث', 'Export CSV': 'تصدير CSV',
    'Search subject, message, name or reference': 'ابحث بالموضوع أو الرسالة أو الاسم أو الرقم المرجعي',
    'All categories': 'جميع التصنيفات', 'All types': 'جميع الأنواع', 'Anonymous & named': 'جميع الهويات', 'Anonymous only': 'مجهولة الهوية فقط', 'Named only': 'بالاسم فقط',
    'Subject': 'الموضوع', 'Category': 'التصنيف', 'Type': 'النوع', 'From': 'المرسل', 'Status': 'الحالة', 'Received': 'تاريخ الاستلام', 'Ref': 'المرجع',
    'No messages here.': 'لا توجد رسائل هنا.', 'Internal note': 'ملاحظة داخلية', '(admins only)': '(للمشرفين فقط)',
    'e.g. Forwarded to the Dean of Student Affairs': 'مثال: أُحيلت إلى عمادة شؤون الطلبة',
    'Last updated': 'آخر تحديث', 'Delete': 'حذف', 'Save changes': 'حفظ التغييرات', 'Close': 'إغلاق',
    'Complaint': 'شكوى', 'Note': 'ملاحظة', 'Suggestion': 'اقتراح',
    'Academic Affairs': 'الشؤون الأكاديمية', 'Courses & Instructors': 'المساقات والمدرّسون', 'Exams & Grades': 'الامتحانات والعلامات',
    'Registration & Admission': 'القبول والتسجيل', 'Financial & Fees': 'الشؤون المالية والرسوم', 'Facilities & Maintenance': 'المرافق والصيانة',
    'IT & E-Learning': 'تقنية المعلومات والتعلّم الإلكتروني', 'Library': 'المكتبة', 'Transportation & Parking': 'المواصلات ومواقف السيارات',
    'Cafeteria': 'الكافتيريا', 'Student Activities & Clubs': 'الأنشطة والأندية الطلابية', 'Safety & Security': 'الأمن والسلامة',
    'Harassment & Discrimination': 'التحرش والتمييز', 'Other': 'أخرى',
    'Please choose a category.': 'يرجى اختيار التصنيف.', 'Please write a subject (at least 3 characters).': 'يرجى كتابة موضوع من ثلاثة أحرف على الأقل.',
    'Please write a message (at least 10 characters).': 'يرجى كتابة رسالة من عشرة أحرف على الأقل.', 'Please enter your name, or choose Anonymous.': 'يرجى إدخال اسمك أو اختيار مجهول الهوية.',
    "Can't reach the PSUT MailBox server. Make sure start.bat is running, then try again.": 'تعذر الاتصال بالخادم. تأكد من تشغيل start.bat ثم حاول مجدداً.',
    "Can't reach the server. Is start.bat running?": 'تعذر الاتصال بالخادم. تأكد من تشغيل start.bat.',
    'Your session expired. Please sign in again.': 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.',
    'Request failed.': 'تعذر إتمام الطلب.', 'Sign in failed.': 'تعذر تسجيل الدخول.', 'Incorrect password.': 'كلمة المرور غير صحيحة.',
    'Changes saved': 'تم حفظ التغييرات', 'Message deleted': 'تم حذف الرسالة', 'Inbox refreshed': 'تم تحديث البريد',
    'Too many submissions. Please wait a few minutes and try again.': 'أرسلت رسائل كثيرة. انتظر بضع دقائق ثم حاول مجدداً.',
    'Too many attempts. Try again in a few minutes.': 'محاولات كثيرة. حاول مجدداً بعد بضع دقائق.',
    'Invalid request.': 'طلب غير صالح.', 'Unauthorized': 'غير مصرح بالدخول', 'Not found': 'غير موجود',
    'Invalid status.': 'الحالة غير صالحة.', 'Nothing to update.': 'لا توجد تغييرات للحفظ.',
    'The PSUT MailBox server is not running. Open the': 'خادم صندوق البريد غير متصل. افتح مجلد',
    'folder, double-click': 'وانقر مرتين على', ', and keep that window open.': '، واترك نافذة التشغيل مفتوحة.'
  };
  let lang = 'en';
  try { lang = localStorage.getItem('psut-language') === 'ar' ? 'ar' : 'en'; } catch (_) {}
  const t = text => lang === 'ar' ? (dictionary[text] || text) : text;
  const bindings = [];
  // Capture only original interface text. Student content is never translated.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style')) continue;
    const key = node.textContent.trim();
    if (dictionary[key]) bindings.push(() => { node.textContent = node.textContent.replace(node.textContent.trim(), t(key)); });
  }
  document.querySelectorAll('[placeholder],[aria-label]').forEach(el => {
    ['placeholder', 'aria-label'].forEach(attr => {
      const key = el.getAttribute(attr);
      if (dictionary[key]) bindings.push(() => el.setAttribute(attr, t(key)));
    });
  });
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'language-switch';
  document.querySelector('.topbar-inner').append(button);
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'صندوق بريد جامعة الأميرة سمية' : (document.body.classList.contains('admin-body') ? 'PSUT MailBox Admin' : 'PSUT MailBox');
    bindings.forEach(fn => fn());
    button.textContent = lang === 'ar' ? 'English' : 'العربية';
    button.lang = lang === 'ar' ? 'en' : 'ar';
    button.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    document.querySelectorAll('option[data-label], [data-label]').forEach(el => { el.textContent = t(el.dataset.label); });
    window.dispatchEvent(new Event('languagechange'));
  }
  window.I18n = { t, get lang() { return lang; }, label(el, key) { el.dataset.label = key; el.textContent = t(key); } };
  button.addEventListener('click', () => {
    lang = lang === 'en' ? 'ar' : 'en';
    try { localStorage.setItem('psut-language', lang); } catch (_) {}
    apply();
  });
  apply();
})();
