import {type TranslationDict, translationFactory} from "@datawheel/use-translation";
import type {Translation as VizbuilderTranslation} from "@datawheel/vizbuilder/react";

const explorerTranslation = {
  action_copy: "Copy",
  action_copy_done: "Copied",
  action_download: "Download",
  action_open: "Open",
  action_reload: "Reload",
  sidebar: {
    dataset: "Select Dataset",
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
    tsv: "TSV",
    parquet: "Parquet",
    // jsonarrays: "JSON Arrays",
    jsonrecords: "JSON Records",
    xlsx: "XLSX",
  },
  loading: {
    title: "Loading...",
    message_heavyquery:
      "The current query might contain a maximum of {{rows}} rows.\nPlease wait...",
    message_default: "Please wait...",
  },
  params: {
    add_metadata: "Add metadata",
    action_clear: "Clear query",
    action_clear_description: "Clear all parameters from your current query",
    action_execute: "Execute query",
    add_columns: "Add Column",
    submit: "Submit",
    column_title: "Parameters",
    current_endpoint: "Current endpoint: {{label}}",
    dimmenu_abbrjoint: ": ",
    dimmenu_dimension: "{{dimension}}",
    dimmenu_hierarchy: "{{abbr}}",
    dimmenu_level: "{{abbr}}",
    filter_mode: "Filter Mode",
    filter_by: "Filter by {{name}}",
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
  tour: {
    controls: {
      prev: "Previous",
      next: "Next",
      help: "Help",
    },
    steps: {
      welcome: {
        title: "Welcome to the Data Explorer",
        text1:
          "This tutorial will guide you through the steps on how to use the Data Explorer",
        text2:
          "By following this tutorial, you will be able to find data of interest and generate your own data tables and visualizations.",
      },
      locale: {
        title: "Multilingual",
        text1: "The Data Explorer makes data available in multiple languages.",
        text2: "Use the dropdown menu to change the output language of the data.",
      },
      dataset: {
        title: "Selecting a Dataset",
        text1: "Begin by selecting a topic of interest.",
        text2: "Then, select a specific data table within that topic grouping.",
      },
      search: {
        title: "Searching for a Dataset",
        text1: "You can also explore the list of topics and datasets.",
        text2: "Start typing to filter the list of datasets with your search",
      },
      table: {
        title: "Data Table",
        text1: "Results are initially displayed as a data table.",
        text2: "Each column header allows live sorting and filtering options.",
      },
      columns: {
        title: "Columns",
        text1: "Select the columns that you are interested in viewing.",
        text2:
          "When you toggle any column checkbox, the data table will automatically update to reflect your selection.",
      },
      filters: {
        title: "Filters",
        text1:
          "You can filter the elements of each column that you want to display in the data table and visualization.",
        text2:
          "If you want all available elements to be displayed, you don't need to apply filters.",
      },
      download: {
        title: "Downloading the Data",
        text1: "You are able to download the information in CSV and JSON formats.",
      },
      api: {
        title: "API",
        text1:
          "You can access the raw data programmatically using the Data Explorer JSON REST API.",
      },
      vizbuilderTab: {
        title: "Vizbuilder",
        text1:
          "You can see the results of your query in different types of visualizations.",
      },
      last: {
        title: "Let's get started!",
        text: "You are ready to start exploring the Data Explorer database and generate your own tables and visualizations.",
        button: "Begin",
      },
    },
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
};

const vizbuilderTranslation: ExtendibleTranslation<VizbuilderTranslation> = {
  action_close: "Close",
  action_share: "Share",
  share_copied: "Copied",
  action_enlarge: "Enlarge",
  action_fileissue: "Report an issue",
  action_retry: "Retry",
  aggregator: {
    average: "Average {{measure}}",
    max: "Max {{measure}}",
    min: "Min {{measure}}",
    sum: "{{measure}}",
  },
  chart_labels: {
    ci: "Confidence Interval",
    moe: "Margin of Error",
    source: "Source",
    collection: "Collection",
  },
  error: {
    detail: "",
    message: 'Details: "{{message}}".',
    title: "Error",
  },
  list: {
    join: ", ",
    suffix: "{{rest}}, and {{item}}",
    prefix: "{{list}}",
    n_more: "{{n}} more",
  },
  title: {
    main_on_period: "{{values}} by {{series}} on {{time_period}}",
    main_over_period: "{{values}} by {{series}} over {{time}}",
    main: "{{values}} by {{series}}",
    measure_on_period: "{{measure}} on {{period}}",
    measure_over_period: "{{values}} over {{time}}",
    nonidealstate: "No results",
    series_members: "{{series}} ({{members}})",
    series: "{{series}}",
    time_range: "in {{from}}-{{to}}",
    total: "Total: {{value}}",
  },
  transient: {
    title_one_row: "The dataset has only one row and can't be used to generate charts.",
    title_loading: "Generating charts...",
    title_empty: "No results",
    description_empty:
      "The selected combination of parameters can't be used to generate a meaningful set of charts. Try changing some parameters (maybe applying some restriction in a column) and generating charts again.",
  },
};

type ExtendibleTranslation<T extends {}> = {
  [K in keyof T]: T[K] extends object ? ExtendibleTranslation<T[K]> : string;
} & {
  [K: string]: string | TranslationDict;
};

export type Translation = ExtendibleTranslation<
  typeof explorerTranslation & {vizbuilder: typeof vizbuilderTranslation}
>;

export const defaultTranslation = {
  ...explorerTranslation,
  vizbuilder: vizbuilderTranslation,
};

export const {useTranslation, TranslationConsumer, TranslationProvider} =
  translationFactory({defaultLocale: "en", defaultTranslation});
