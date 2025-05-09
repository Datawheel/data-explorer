import enTranslationDict from "./en";

export default {
  action_copy: "نسخ",
  action_copy_done: "تم النسخ",
  action_download: "تنزيل",
  action_open: "فتح",
  action_reload: "إعادة تحميل",
  comparison: {
    EQ: "مساوي لـ",
    GT: "أكبر من",
    GTE: "مساوي أو أكبر من",
    LT: "أقل من",
    LTE: "مساوي أو أقل من",
    NEQ: "غير مساوي لـ"
  },
  debug_view: {
    tab_label: "أداة التصحيح",
    httpheaders: "رؤوس الاستجابة",
    jssource_prefix: "مصدر جافا سكريبت لـ ",
    jssource_suffix: "",
    url_aggregate: "رابط API المجمع",
    url_logiclayer: "رابط API لـ LogicLayer"
  },
  direction: {
    ASC: "تصاعدي",
    DESC: "تنازلي"
  },
  formats: {
    csv: "CSV",
    json: "JSON",
    jsonarrays: "مصفوفات JSON",
    jsonrecords: "سجلات JSON",
    xlsx: "XLSX"
  },
  loading: {
    title: "جارٍ التحميل...",
    message_heavyquery: "قد تحتوي الاستعلام الحالي على حد أقصى من {{rows}} صفوف.\nيرجى الانتظار...",
    message_default: "يرجى الانتظار..."
  },
  params: {
    action_clear: "مسح الاستعلام",
    action_clear_description: "مسح جميع المعلمات من الاستعلام الحالي",
    action_execute: "تنفيذ الاستعلام",
    add_columns: "إضافة أعمدة",
    column_title: "المعلمات",
    current_endpoint: "نقطة النهاية الحالية: {{label}}",
    dimmenu_abbrjoint: ": ",
    dimmenu_dimension: "{{dimension}}",
    dimmenu_hierarchy: "{{abbr}}",
    dimmenu_level: "{{abbr}}",
    filter_mode: "وضع التصفية",
    filter_by: "التصفية بواسطة {{name}}",
    error_no_cut_selected_detail: "يمكنك إضافة فلاتر البيانات بناءً على التفاصيل المحددة.",
    error_no_cut_selected_title: "لم تتم إضافة قطع",
    error_no_dimension_selected_detail: "يجب عليك إضافة تفصيل واحد على الأقل.",
    error_no_dimension_selected_title: "لم يتم تحديد تفاصيل",
    error_fetchmembers_detail: "حدث خطأ أثناء تحميل قائمة الأعضاء.",
    error_fetchmembers_title: "خطأ في تحميل قائمة الأعضاء",
    label_amount: "الكمية",
    label_boolean_debug: "استجابة التصحيح",
    label_boolean_distinct: "تطبيق DISTINCT على التفاصيل",
    label_boolean_exclude_default_members: "استبعاد الأعضاء الافتراضيين",
    label_boolean_full_results: "عرض جميع الصفوف",
    label_boolean_nonempty: "إرجاع البيانات غير الفارغة فقط",
    label_boolean_parents: "تضمين المستويات العليا",
    label_boolean_sparse: "تحسين النتائج المتناثرة",
    label_clear: "مسح",
    label_cube: "مكعب",
    label_cuts_filterby_id: "معرفات",
    label_cuts_filterby_name: "أسماء",
    label_cuts_filterby_any: "أي",
    label_fullscreen: "شاشة كاملة",
    label_locale: "اللغة",
    label_search: "بحث",
    label_no_results: "لا توجد نتائج",
    label_dataset: "اختر مجموعة البيانات",
    label_localeoption: "{{nativeName}}",
    label_measure: "مقياس",
    label_pagination_limit: "حد النتائج",
    label_pagination_offset: "إزاحة النتائج",
    label_sorting_key: "الفرز حسب",
    label_sorting_order: "الترتيب",
    label_source: "المصدر",
    label_subtopic: "موضوع فرعي",
    label_table: "جدول",
    label_timelevel: "مستوى الوقت",
    label_topic: "الموضوع",
    search_placeholder: "تصفية (يدعم تعبيرات regex)",
    tag_cuts_plural: "{{abbr}} ({{n}} محدد)",
    tag_cuts: "{{abbr}} ({{first_member}})",
    tag_drilldowns_abbrjoint: "/",
    tag_drilldowns: "{{abbr}}",
    title_area_cuts: "القطع ({{n}})",
    title_area_drilldowns: "التفاصيل ({{n}})",
    title_area_filters: "الفلاتر ({{n}})",
    title_area_measures: "المقاييس ({{n}})",
    title_area_options: "خيارات الاستعلام",
    title_area_pagination: "الترقيم",
    title_area_sorting: "الفرز",
    title_caption: "التسمية التوضيحية",
    title_downloaddata: "تنزيل مجموعة البيانات",
    title_members: "الأعضاء",
    title_properties: "الخصائص",
    tooltip_area_cuts: "",
    tooltip_area_drilldowns: "",
    tooltip_area_filters: "",
    tooltip_area_measures: "",
    tooltip_area_options: ""
  },
  pivot_view: {
    tab_label: "محور البيانات",
    error_missingparams:
      "لا يحتوي الاستعلام الحالي على معلمات كافية. مطلوب تفاصيل مختلفة ومقياس واحد.",
    error_onedimension: "تحتاج الصفوف والأعمدة في الجدول المحوري إلى تفصيلين مختلفين.",
    error_internal: "حدث خطأ داخلي في أداة المحور. سنقوم بإصلاحه في أقرب وقت ممكن.",
    error_internal_detail:
      "إذا كنت بحاجة إلى الاتصال بنا بشأن هذا الخطأ، يرجى تضمين هذه الرسالة:\n{error}",
    label_ddcolumn: "تفصيل العمود",
    label_ddcolumnprop: "خاصية العمود",
    label_ddrow: "تفصيل الصف",
    label_ddrowprop: "خاصية الصف",
    label_formatter: "تنسيق الأرقام",
    label_valmeasure: "مقياس القيمة",
    loading_details: "قد يستغرق هذا بعض الوقت، يرجى الانتظار...",
    loading_title: "إعادة هيكلة البيانات",
    title_download: "تنزيل المصفوفة",
    title_params: "معلمات المصفوفة",
    warning: "تحذير",
    warning_notsummeasure:
      'الاستعلام الحالي يحتوي على أكثر من تفصيلين، ونوع التجميع للمقياس ليس "SUM". قد تكون القيم التي تحصل عليها غير ذات مغزى.',
    warning_propertypivot:
      "على عكس أعضاء التفصيل، لا تضمن خصائص التفصيل التفرد. في هذا العرض، يتم تجميع نقاط البيانات بناءً على تسميات الخصائص، لذا يرجى التأكد من أنك لا تفقد المعلومات.",
    warning_sumdimensions: "هناك أكثر من تفصيلين في هذا الاستعلام. سيتم جمع القيم المتبقية."
  },
  placeholders: {
    incomplete: "[معلمات غير مكتملة]",
    unselected: "[غير محدد]",
    none: "[لا شيء]"
  },
  previewMode: {
    btn_get_all: "عرض كل الصفوف",
    btn_get_preview: "عرض المعاينة",
    description_full: "أنت تشاهد حاليًا جميع الصفوف المتاحة. قم بإيقافها للحصول على أداء أسرع.",
    description_preview: "أنت تشاهد حاليًا استجابة معاينة لأول {{limit}} صفوف.",
    title_full: "جميع السجلات",
    title_preview: "سجلات المعاينة"
  },
  queries: {
    action_create: "استعلام جديد",
    action_parse: "استعلام من URL",
    error_not_query: "يرجى إنشاء استعلام صالح",
    error_no_drilldowns: "يجب إضافة تفصيل واحد على الأقل.",
    error_no_measures: "يجب إضافة مقياس واحد على الأقل.",
    error_one_hierarchy_per_dimension: "يجب تحديد تفاصيل لتسلسل هرمي واحد فقط.",
    error_one_cut_per_dimension: "يجب تطبيق قطع على مستويات تسلسل هرمي واحد فقط.",
    column_title: "الاستعلامات",
    unset_parameters: "لم يتم تعيين المعلمات"
  },
  results: {
    error_execquery_detail: "كانت هناك مشكلة في الاستعلام الأخير:",
    error_disconnected_title: "أنت غير متصل بالإنترنت.",
    error_serveroffline_title: "هناك مشكلة في الاتصال بالخادم",
    error_serveroffline_detail: "تحقق من توفر URL",
    error_emptyresult_title: "مجموعة بيانات فارغة",
    error_emptyresult_detail: "لم يُرجع الاستعلام أي عناصر. حاول مرة أخرى بمعلمات مختلفة.",
    count_rows: "{{n}} صف",
    count_rows_plural: "{{n}} صفوف"
  },
  selectlevel_placeholder: "مستوى...",
  selectmeasure_placeholder: "مقياس...",
  selecttimelevel_placeholder: "مستوى الوقت...",
  table_view: {
    tab_label: "جدول البيانات",
    numeral_format: "تنسيق الأرقام",
    sort_asc: "ترتيب تصاعدي",
    sort_desc: "ترتيب تنازلي"
  },
  transfer_input: {
    count_hidden: "{{n}} عنصر مخفي",
    count_hidden_plural: "{{n}} عناصر مخفية",
    search_placeholder: "تصفية (يدعم تعبيرات regex)",
    select_all: "تحديد الكل",
    unselect_all: "إلغاء تحديد الكل",
    select_filtered: "تحديد المصفاة",
    unselect_filtered: "إلغاء تحديد المصفاة",
    selected_items: "العناصر المحددة",
    unselected_items: "العناصر غير المحددة"
  },
  // vizbuilder: enTranslationDict.vizbuilder,
  vizbuilder: {
    action_close: "اغلاق",
    action_share: "مشاركة",
    share_copied: "تم النسخ",
    action_enlarge: "تكبير",
    action_fileissue: "إبلاغ عن مشكلة",
    action_retry: "إعادة تنفيذ",
    aggregator: {
      average: "متوسط {{measure}}",
      max: "أقصى {{measure}}",
      min: "أدنى {{measure}}",
      sum: "{{measure}}"
    },
    chart_labels: {
      ci: "فترة الثقة",
      moe: "الخطأ المتراكم",
      source: "المصدر",
      collection: "المجموعة"
    },
    error: {
      detail: "",
      message: 'Details: "{{message}}".',
      title: "خطأ"
    },
    list: {
      join: ", ",
      suffix: "{{rest}}, و {{item}}",
      prefix: "{{list}}",
      n_more: "{{n}} أكثر"
    },
    title: {
      main_on_period: "{{values}} بواسطة {{series}} خلال {{time_period}}",
      main_over_period: "{{values}} بواسطة {{series}} خلال {{time}}",
      main: "{{values}} بواسطة {{series}}",
      measure_on_period: "{{measure}} خلال {{period}}",
      measure_over_period: "{{values}} خلال {{time}}",
      nonidealstate: "لا يوجد نتائج",
      series_members: "{{series}} ({{members}})",
      series: "{{series}}",
      time_range: "في {{from}}-{{to}}",
      total: "المجموع: {{value}}"
    },
    transient: {
      title_one_row: "تحتوي مجموعة البيانات على صف واحد فقط ولا يمكن استخدامها لإنشاء رسوم بيانية.",
      title_loading: "يتم إنشاء الرسوم البيانية...",
      title_empty: "لا يوجد نتائج",
      description_empty:
        "لا يمكن استخدام الاستعلام الحالي لإنشاء مجموعة من الرسوم البيانية. حاول تغيير بعض المعلمات (ربما بتطبيق بعض القيود على عمود) وإعادة إنشاء الرسوم البيانية."
    }
  }
};
