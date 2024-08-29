import { translationFactory } from "@datawheel/use-translation";
import { translationDict as vizbuilderTranslationDict } from "@datawheel/vizbuilder";

export const defaultTranslation = {
  action_copy: "Copy",
  action_copy_done: "Copied",
  action_download: "Download",
  action_open: "Open",
  action_reload: "Reload",
  sidebar: {
    dataset: "Select Dataset"
  },
  comparison: {
    BT: "Between",
    EQ: "Equal to",
    GT: "Greater than",
    GTE: "Equal or greater than",
    LT: "Lower than",
    LTE: "Equal or lower than",
    NEQ: "Not equal to",
  },
  debug_view: {
    tab_label: "Debugger",
    httpheaders: "Response headers",
    jssource_prefix: "Javascript source for ",
    jssource_suffix: "",
    url_aggregate: "Aggregate API URL",
    url_logiclayer: "LogicLayer API URL",
  },
  direction: {
    ASC: "Ascending",
    DESC: "Descending",
  },
  formats: {
    csv: "CSV",
    json: "JSON",
    jsonarrays: "JSON Arrays",
    jsonrecords: "JSON Records",
    xls: "XLS",
  },
  loading: {
    title: "Loading...",
    message_heavyquery:
      "The current query might contain a maximum of {{rows}} rows.\nPlease wait...",
    message_default: "Please wait...",
  },
  params: {
    action_clear: "Clear query",
    action_clear_description: "Clear all parameters from your current query",
    action_execute: "Execute query",
    add_columns: "Add columns",
    column_title: "Parameters",
    current_endpoint: "Current endpoint: {{label}}",
    dimmenu_abbrjoint: ": ",
    dimmenu_dimension: "{{dimension}}",
    dimmenu_hierarchy: "{{abbr}}",
    dimmenu_level: "{{abbr}}",
    filter_mode: "Filter Mode",
    error_no_cut_selected_detail:
      "You can add data filters based on selected drilldowns.",
    error_no_cut_selected_title: "No cuts added",
    error_no_dimension_selected_detail: "You must add at least one drilldown.",
    error_no_dimension_selected_title: "No drilldowns selected",
    error_fetchmembers_detail: "An error ocurred while loading the member list.",
    error_fetchmembers_title: "Error loading member list",
    label_amount: "Amount",
    label_boolean_debug: "Debug response",
    label_boolean_distinct: "Apply DISTINCT to drilldowns",
    label_boolean_exclude_default_members: "Exclude default members",
    label_boolean_full_results: "Show all rows",
    label_boolean_nonempty: "Only return non-empty data",
    label_boolean_parents: "Include parent levels",
    label_boolean_sparse: "Optimize sparse results",
    label_clear: "Clear",
    label_cube: "Cube",
    label_cuts_filterby_id: "IDs",
    label_cuts_filterby_name: "Names",
    label_cuts_filterby_any: "Any",
    label_fullscreen: "Full screen",
    label_locale: "Language",
    label_search: "Search",
    label_no_results: "No results",
    label_dataset: "Select Dataset",
    label_localeoption: "{{nativeName}}",
    label_measure: "Measure",
    label_pagination_limit: "Results limit",
    label_pagination_offset: "Results offset",
    label_sorting_key: "Sort by",
    label_sorting_order: "Order",
    label_source: "Source",
    label_subtopic: "Subtopic",
    label_table: "Table",
    label_timelevel: "Time level",
    label_topic: "Topic",
    search_placeholder: "Filter (regex enabled)",
    tag_cuts_plural: "{{abbr}} ({{n}} selected)",
    tag_cuts: "{{abbr}} ({{first_member}})",
    tag_drilldowns_abbrjoint: "/",
    tag_drilldowns: "{{abbr}}",
    title_area_cuts: "Cuts ({{n}})",
    title_area_drilldowns: "Drilldowns ({{n}})",
    title_area_filters: "Filters ({{n}})",
    title_area_measures: "Measures ({{n}})",
    title_area_options: "Query options",
    title_area_pagination: "Pagination",
    title_area_sorting: "Sorting",
    title_caption: "Caption",
    title_downloaddata: "Download dataset",
    title_members: "Members",
    title_properties: "Properties",
    tooltip_area_cuts: "",
    tooltip_area_drilldowns: "",
    tooltip_area_filters: "",
    tooltip_area_measures: "",
    tooltip_area_options: "",
  },
  pivot_view: {
    tab_label: "Pivot Data",
    error_missingparams:
      "The current query doesn't have enough parameters. Two different drilldowns and a measure are needed.",
    error_onedimension:
      "The rows and columns in a pivotted table need 2 different drilldowns.",
    error_internal:
      "An internal error ocurred in the pivotting tool. We will fix it as soon as possible.",
    error_internal_detail:
      "If you need to contact us about this error, please include this message:\n{error}",
    label_ddcolumn: "Column drilldown",
    label_ddcolumnprop: "Column property",
    label_ddrow: "Row drilldown",
    label_ddrowprop: "Row property",
    label_formatter: "Numeral format",
    label_valmeasure: "Value measure",
    loading_details: "This might take a while, please wait...",
    loading_title: "Reestructuring data",
    title_download: "Download matrix",
    title_params: "Matrix params",
    warning: "Warning",
    warning_notsummeasure:
      'The current query contains more than 2 drilldowns, and the aggregation type of the measure is not "SUM". The values you\'re getting might not be meaningful.',
    warning_propertypivot:
      "Unlike Drilldown Members, Drilldown Properties are not guaranteed to be unique. In this view, data points are aggregated based on the property labels, so please ensure you're not missing information.",
    warning_sumdimensions:
      "There's more than 2 drilldowns in this query. Remaining values will be summed.",
  },
  placeholders: {
    incomplete: "[Incomplete parameters]",
    unselected: "[Unselected]",
    none: "[None]",
  },
  previewMode: {
    btn_get_all: "Show all rows",
    btn_get_preview: "Show preview",
    description_full:
      "You are currently viewing all available rows. Turn off for faster performance.",
    description_preview:
      "You are currently viewing a preview response of the first {{limit}} rows.",
    title_full: "All records",
    title_preview: "Preview records",
  },
  queries: {
    action_create: "New query",
    action_parse: "Query from URL",
    error_not_query: "Please construct a valid query",
    error_no_drilldowns: "You must add at least one drilldown.",
    error_no_measures: "You must add at least one measure.",
    error_one_hierarchy_per_dimension:
      "You must only select drilldowns of a single hierarchy.",
    error_one_cut_per_dimension:
      "You must only apply cuts over levels of a single hierarchy.",
    column_title: "Queries",
    unset_parameters: "No parameters set",
  },
  results: {
    error_execquery_detail: "There was a problem with the last query:",
    error_disconnected_title: "You are not connected to the internet.",
    error_serveroffline_title: "There's a problem contacting with the server",
    error_serveroffline_detail: "Check the availability of the URL ",
    error_emptyresult_title: "Empty dataset",
    error_emptyresult_detail:
      "The query didn't return elements. Try again with different parameters.",
    count_rows: "{{n}} row",
    count_rows_plural: "{{n}} rows",
  },
  selectlevel_placeholder: "Level...",
  selectmeasure_placeholder: "Measure...",
  selecttimelevel_placeholder: "Time level...",
  table_view: {
    tab_label: "Data Table",
    numeral_format: "Numeral format",
    sort_asc: "Sort Asc",
    sort_desc: "Sort Desc",
  },
  transfer_input: {
    count_hidden: "{{n}} item hidden",
    count_hidden_plural: "{{n}} items hidden",
    search_placeholder: "Filter (regex enabled)",
    select_all: "Select all",
    unselect_all: "Unselect all",
    select_filtered: "Select filtered",
    unselect_filtered: "Unselect filtered",
    selected_items: "Selected items",
    unselected_items: "Unselected items",
  },
  vizbuilder: vizbuilderTranslationDict,
};

export type TranslationDict = typeof defaultTranslation;

export const { useTranslation, TranslationConsumer, TranslationProvider } =
  translationFactory({ defaultLocale: "en", defaultTranslation });
