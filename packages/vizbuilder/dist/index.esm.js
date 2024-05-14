import { TranslationConsumer, useSettings, useTranslation } from '@datawheel/tesseract-explorer';
import { generateCharts, createChartConfig } from '@datawheel/vizbuilder';
import { Flex, Title, Text, Group, Button, SimpleGrid, Box, Modal, Paper, Stack } from '@mantine/core';
import React2, { useMemo, useCallback, useRef } from 'react';
import { IconDownload, IconArrowsMinimize, IconArrowsMaximize, IconPhotoDown, IconVectorTriangle } from '@tabler/icons-react';
import { BarChart, Donut, Geomap, LinePlot, Pie, StackedArea, Treemap } from 'd3plus-react';

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// node_modules/tsup/assets/esm_shims.js
var init_esm_shims = __esm({
  "node_modules/tsup/assets/esm_shims.js"() {
  }
});

// ../../node_modules/file-saver/FileSaver.js
var require_FileSaver = __commonJS({
  "../../node_modules/file-saver/FileSaver.js"(exports, module) {
    init_esm_shims();
    var saveAs2 = saveAs2 || function(view) {
      if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return;
      }
      var doc = view.document, get_URL = function() {
        return view.URL || view.webkitURL || view;
      }, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = "download" in save_link, click = function(node) {
        var event = new MouseEvent("click");
        node.dispatchEvent(event);
      }, is_safari = /constructor/i.test(view.HTMLElement) || view.safari, is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent), throw_outside = function(ex) {
        (view.setImmediate || view.setTimeout)(function() {
          throw ex;
        }, 0);
      }, force_saveable_type = "application/octet-stream", arbitrary_revoke_timeout = 1e3 * 40, revoke = function(file) {
        var revoker = function() {
          if (typeof file === "string") {
            get_URL().revokeObjectURL(file);
          } else {
            file.remove();
          }
        };
        setTimeout(revoker, arbitrary_revoke_timeout);
      }, dispatch = function(filesaver, event_types, event) {
        event_types = [].concat(event_types);
        var i = event_types.length;
        while (i--) {
          var listener = filesaver["on" + event_types[i]];
          if (typeof listener === "function") {
            try {
              listener.call(filesaver, event || filesaver);
            } catch (ex) {
              throw_outside(ex);
            }
          }
        }
      }, auto_bom = function(blob) {
        if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
          return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
        }
        return blob;
      }, FileSaver = function(blob, name, no_auto_bom) {
        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }
        var filesaver = this, type = blob.type, force = type === force_saveable_type, object_url, dispatch_all = function() {
          dispatch(filesaver, "writestart progress write writeend".split(" "));
        }, fs_error = function() {
          if ((is_chrome_ios || force && is_safari) && view.FileReader) {
            var reader = new FileReader();
            reader.onloadend = function() {
              var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, "data:attachment/file;");
              var popup = view.open(url, "_blank");
              if (!popup)
                view.location.href = url;
              url = void 0;
              filesaver.readyState = filesaver.DONE;
              dispatch_all();
            };
            reader.readAsDataURL(blob);
            filesaver.readyState = filesaver.INIT;
            return;
          }
          if (!object_url) {
            object_url = get_URL().createObjectURL(blob);
          }
          if (force) {
            view.location.href = object_url;
          } else {
            var opened = view.open(object_url, "_blank");
            if (!opened) {
              view.location.href = object_url;
            }
          }
          filesaver.readyState = filesaver.DONE;
          dispatch_all();
          revoke(object_url);
        };
        filesaver.readyState = filesaver.INIT;
        if (can_use_save_link) {
          object_url = get_URL().createObjectURL(blob);
          setTimeout(function() {
            save_link.href = object_url;
            save_link.download = name;
            click(save_link);
            dispatch_all();
            revoke(object_url);
            filesaver.readyState = filesaver.DONE;
          });
          return;
        }
        fs_error();
      }, FS_proto = FileSaver.prototype, saveAs3 = function(blob, name, no_auto_bom) {
        return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
      };
      if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function(blob, name, no_auto_bom) {
          name = name || blob.name || "download";
          if (!no_auto_bom) {
            blob = auto_bom(blob);
          }
          return navigator.msSaveOrOpenBlob(blob, name);
        };
      }
      FS_proto.abort = function() {
      };
      FS_proto.readyState = FS_proto.INIT = 0;
      FS_proto.WRITING = 1;
      FS_proto.DONE = 2;
      FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
      return saveAs3;
    }(
      typeof self !== "undefined" && self || typeof window !== "undefined" && window || exports.content
    );
    if (typeof module !== "undefined" && module.exports) {
      module.exports.saveAs = saveAs2;
    } else if (typeof define !== "undefined" && define !== null && define.amd !== null) {
      define("FileSaver.js", function() {
        return saveAs2;
      });
    }
  }
});

// src/index.ts
init_esm_shims();

// src/components/VizbuilderView.tsx
init_esm_shims();

// ../../node_modules/clsx/dist/clsx.m.js
init_esm_shims();
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e)
    n += e;
  else if ("object" == typeof e)
    if (Array.isArray(e))
      for (t = 0; t < e.length; t++)
        e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    else
      for (t in e)
        e[t] && (n && (n += " "), n += t);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = ""; f < arguments.length; )
    (e = arguments[f++]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
var clsx_m_default = clsx;

// src/tooling/accesor.ts
init_esm_shims();
function measureConfigAccessor(config) {
  if (typeof config === "function") {
    return config;
  }
  return (item) => config[item.name];
}

// src/tooling/collection.ts
init_esm_shims();
function asArray(value) {
  const target = [];
  return target.concat(value).filter((item) => item != null);
}
function mapActives(dict, mapFn) {
  return Object.values(dict).filter((item) => item.active).map(mapFn);
}

// src/tooling/constants.ts
init_esm_shims();
var DEFAULT_CHART_LIMITS = {
  BARCHART_MAX_BARS: 20,
  BARCHART_YEAR_MAX_BARS: 20,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_POINT_MIN: 2,
  LINEPLOT_LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1e3
};

// src/components/ChartCard.tsx
init_esm_shims();

// ../../node_modules/d3plus-export/es/index.js
init_esm_shims();

// ../../node_modules/d3plus-export/es/src/saveElement.js
init_esm_shims();

// ../../node_modules/html-to-image/es/index.js
init_esm_shims();

// ../../node_modules/html-to-image/es/clone-node.js
init_esm_shims();

// ../../node_modules/html-to-image/es/clone-pseudos.js
init_esm_shims();

// ../../node_modules/html-to-image/es/util.js
init_esm_shims();
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a);
  if (baseUrl) {
    base.href = baseUrl;
  }
  a.href = url;
  return a.href;
}
var uuid = (() => {
  let counter = 0;
  const random = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * __pow(36, 4) << 0).toString(36)}`.slice(-4)
  );
  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();
function toArray(arrayLike) {
  const arr = [];
  for (let i = 0, l = arrayLike.length; i < l; i++) {
    arr.push(arrayLike[i]);
  }
  return arr;
}
function px(node, styleProperty) {
  const win = node.ownerDocument.defaultView || window;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? parseFloat(val.replace("px", "")) : 0;
}
function getNodeWidth(node) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.clientHeight + topBorder + bottomBorder;
}
function getImageSize(targetNode, options = {}) {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
}
function getPixelRatio() {
  let ratio;
  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e) {
  }
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
var canvasDimensionLimit = 16384;
function checkCanvasDimensions(canvas) {
  if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
    if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvas.height) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    } else if (canvas.width > canvasDimensionLimit) {
      canvas.height *= canvasDimensionLimit / canvas.width;
      canvas.width = canvasDimensionLimit;
    } else {
      canvas.width *= canvasDimensionLimit / canvas.height;
      canvas.height = canvasDimensionLimit;
    }
  }
}
function canvasToBlob(canvas, options = {}) {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
    });
  }
  return new Promise((resolve) => {
    const binaryString = window.atob(canvas.toDataURL(options.type ? options.type : void 0, options.quality ? options.quality : void 0).split(",")[1]);
    const len = binaryString.length;
    const binaryArray = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }
    resolve(new Blob([binaryArray], {
      type: options.type ? options.type : "image/png"
    }));
  });
}
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decode = () => resolve(img);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
  });
}
function svgToDataURL(svg) {
  return __async(this, null, function* () {
    return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
  });
}
function nodeToDataURL(node, width, height) {
  return __async(this, null, function* () {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    const foreignObject = document.createElementNS(xmlns, "foreignObject");
    svg.setAttribute("width", `${width}`);
    svg.setAttribute("height", `${height}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.setAttribute("x", "0");
    foreignObject.setAttribute("y", "0");
    foreignObject.setAttribute("externalResourcesRequired", "true");
    svg.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svgToDataURL(svg);
  });
}
var isInstanceOfElement = (node, instance) => {
  if (node instanceof instance)
    return true;
  const nodePrototype = Object.getPrototypeOf(node);
  if (nodePrototype === null)
    return false;
  return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
};

// ../../node_modules/html-to-image/es/clone-pseudos.js
function formatCSSText(style) {
  const content = style.getPropertyValue("content");
  return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
}
function formatCSSProperties(style) {
  return toArray(style).map((name) => {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    return `${name}: ${value}${priority ? " !important" : ""};`;
  }).join(" ");
}
function getPseudoElementStyle(className, pseudo, style) {
  const selector = `.${className}:${pseudo}`;
  const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style);
  return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
  const style = window.getComputedStyle(nativeNode, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return;
  }
  const className = uuid();
  try {
    clonedNode.className = `${clonedNode.className} ${className}`;
  } catch (err) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
  clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode) {
  clonePseudoElement(nativeNode, clonedNode, ":before");
  clonePseudoElement(nativeNode, clonedNode, ":after");
}

// ../../node_modules/html-to-image/es/mimes.js
init_esm_shims();
var WOFF = "application/font-woff";
var JPEG = "image/jpeg";
var mimes = {
  woff: WOFF,
  woff2: WOFF,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: JPEG,
  jpeg: JPEG,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function getExtension(url) {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : "";
}
function getMimeType(url) {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || "";
}

// ../../node_modules/html-to-image/es/dataurl.js
init_esm_shims();
function getContentFromDataUrl(dataURL) {
  return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
  return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
  return `data:${mimeType};base64,${content}`;
}
function fetchAsDataURL(url, init, process2) {
  return __async(this, null, function* () {
    const res = yield fetch(url, init);
    if (res.status === 404) {
      throw new Error(`Resource "${res.url}" not found`);
    }
    const blob = yield res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => {
        try {
          resolve(process2({ res, result: reader.result }));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(blob);
    });
  });
}
var cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
  let key = url.replace(/\?.*/, "");
  if (includeQueryParams) {
    key = url;
  }
  if (/ttf|otf|eot|woff2?/i.test(key)) {
    key = key.replace(/.*\//, "");
  }
  return contentType ? `[${contentType}]${key}` : key;
}
function resourceToDataURL(resourceUrl, contentType, options) {
  return __async(this, null, function* () {
    const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
    if (cache[cacheKey] != null) {
      return cache[cacheKey];
    }
    if (options.cacheBust) {
      resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
    }
    let dataURL;
    try {
      const content = yield fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
        if (!contentType) {
          contentType = res.headers.get("Content-Type") || "";
        }
        return getContentFromDataUrl(result);
      });
      dataURL = makeDataUrl(content, contentType);
    } catch (error) {
      dataURL = options.imagePlaceholder || "";
      let msg = `Failed to fetch resource: ${resourceUrl}`;
      if (error) {
        msg = typeof error === "string" ? error : error.message;
      }
      if (msg) {
        console.warn(msg);
      }
    }
    cache[cacheKey] = dataURL;
    return dataURL;
  });
}

// ../../node_modules/html-to-image/es/clone-node.js
function cloneCanvasElement(canvas) {
  return __async(this, null, function* () {
    const dataURL = canvas.toDataURL();
    if (dataURL === "data:,") {
      return canvas.cloneNode(false);
    }
    return createImage(dataURL);
  });
}
function cloneVideoElement(video, options) {
  return __async(this, null, function* () {
    if (video.currentSrc) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL2 = canvas.toDataURL();
      return createImage(dataURL2);
    }
    const poster = video.poster;
    const contentType = getMimeType(poster);
    const dataURL = yield resourceToDataURL(poster, contentType, options);
    return createImage(dataURL);
  });
}
function cloneIFrameElement(iframe) {
  return __async(this, null, function* () {
    var _a;
    try {
      if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
        return yield cloneNode(iframe.contentDocument.body, {}, true);
      }
    } catch (_b) {
    }
    return iframe.cloneNode(false);
  });
}
function cloneSingleNode(node, options) {
  return __async(this, null, function* () {
    if (isInstanceOfElement(node, HTMLCanvasElement)) {
      return cloneCanvasElement(node);
    }
    if (isInstanceOfElement(node, HTMLVideoElement)) {
      return cloneVideoElement(node, options);
    }
    if (isInstanceOfElement(node, HTMLIFrameElement)) {
      return cloneIFrameElement(node);
    }
    return node.cloneNode(false);
  });
}
var isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
function cloneChildren(nativeNode, clonedNode, options) {
  return __async(this, null, function* () {
    var _a, _b;
    let children = [];
    if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
      children = toArray(nativeNode.assignedNodes());
    } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
      children = toArray(nativeNode.contentDocument.body.childNodes);
    } else {
      children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
    }
    if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
      return clonedNode;
    }
    yield children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
      if (clonedChild) {
        clonedNode.appendChild(clonedChild);
      }
    }), Promise.resolve());
    return clonedNode;
  });
}
function cloneCSSStyle(nativeNode, clonedNode) {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }
  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    toArray(sourceStyle).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === "font-size" && value.endsWith("px")) {
        const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
        value = `${reducedFont}px`;
      }
      if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
        value = "block";
      }
      if (name === "d" && clonedNode.getAttribute("d")) {
        value = `path(${clonedNode.getAttribute("d")})`;
      }
      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
}
function cloneInputValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }
  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute("value", nativeNode.value);
  }
}
function cloneSelectValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode;
    const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
    if (selectedOption) {
      selectedOption.setAttribute("selected", "");
    }
  }
}
function decorate(nativeNode, clonedNode) {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode);
    clonePseudoElements(nativeNode, clonedNode);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
  }
  return clonedNode;
}
function ensureSVGSymbols(clone, options) {
  return __async(this, null, function* () {
    const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
    if (uses.length === 0) {
      return clone;
    }
    const processedDefs = {};
    for (let i = 0; i < uses.length; i++) {
      const use = uses[i];
      const id = use.getAttribute("xlink:href");
      if (id) {
        const exist = clone.querySelector(id);
        const definition = document.querySelector(id);
        if (!exist && definition && !processedDefs[id]) {
          processedDefs[id] = yield cloneNode(definition, options, true);
        }
      }
    }
    const nodes = Object.values(processedDefs);
    if (nodes.length) {
      const ns = "http://www.w3.org/1999/xhtml";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("xmlns", ns);
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.overflow = "hidden";
      svg.style.display = "none";
      const defs = document.createElementNS(ns, "defs");
      svg.appendChild(defs);
      for (let i = 0; i < nodes.length; i++) {
        defs.appendChild(nodes[i]);
      }
      clone.appendChild(svg);
    }
    return clone;
  });
}
function cloneNode(node, options, isRoot) {
  return __async(this, null, function* () {
    if (!isRoot && options.filter && !options.filter(node)) {
      return null;
    }
    return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
  });
}

// ../../node_modules/html-to-image/es/embed-images.js
init_esm_shims();

// ../../node_modules/html-to-image/es/embed-resources.js
init_esm_shims();
var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function parseURLs(cssText) {
  const urls = [];
  cssText.replace(URL_REGEX, (raw, quotation, url) => {
    urls.push(url);
    return raw;
  });
  return urls.filter((url) => !isDataUrl(url));
}
function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
  return __async(this, null, function* () {
    try {
      const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
      const contentType = getMimeType(resourceURL);
      let dataURL;
      if (getContentFromUrl) {
        const content = yield getContentFromUrl(resolvedURL);
        dataURL = makeDataUrl(content, contentType);
      } else {
        dataURL = yield resourceToDataURL(resolvedURL, contentType, options);
      }
      return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
    } catch (error) {
    }
    return cssText;
  });
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
  return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
      if (!format) {
        return "";
      }
      if (format === preferredFontFormat) {
        return `src: ${src};`;
      }
    }
  });
}
function shouldEmbed(url) {
  return url.search(URL_REGEX) !== -1;
}
function embedResources(cssText, baseUrl, options) {
  return __async(this, null, function* () {
    if (!shouldEmbed(cssText)) {
      return cssText;
    }
    const filteredCSSText = filterPreferredFontFormat(cssText, options);
    const urls = parseURLs(filteredCSSText);
    return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
  });
}

// ../../node_modules/html-to-image/es/embed-images.js
function embedProp(propName, node, options) {
  return __async(this, null, function* () {
    var _a;
    const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
    if (propValue) {
      const cssString = yield embedResources(propValue, null, options);
      node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
      return true;
    }
    return false;
  });
}
function embedBackground(clonedNode, options) {
  return __async(this, null, function* () {
    if (!(yield embedProp("background", clonedNode, options))) {
      yield embedProp("background-image", clonedNode, options);
    }
    if (!(yield embedProp("mask", clonedNode, options))) {
      yield embedProp("mask-image", clonedNode, options);
    }
  });
}
function embedImageNode(clonedNode, options) {
  return __async(this, null, function* () {
    const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
    if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
      return;
    }
    const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
    const dataURL = yield resourceToDataURL(url, getMimeType(url), options);
    yield new Promise((resolve, reject) => {
      clonedNode.onload = resolve;
      clonedNode.onerror = reject;
      const image = clonedNode;
      if (image.decode) {
        image.decode = resolve;
      }
      if (image.loading === "lazy") {
        image.loading = "eager";
      }
      if (isImageElement) {
        clonedNode.srcset = "";
        clonedNode.src = dataURL;
      } else {
        clonedNode.href.baseVal = dataURL;
      }
    });
  });
}
function embedChildren(clonedNode, options) {
  return __async(this, null, function* () {
    const children = toArray(clonedNode.childNodes);
    const deferreds = children.map((child) => embedImages(child, options));
    yield Promise.all(deferreds).then(() => clonedNode);
  });
}
function embedImages(clonedNode, options) {
  return __async(this, null, function* () {
    if (isInstanceOfElement(clonedNode, Element)) {
      yield embedBackground(clonedNode, options);
      yield embedImageNode(clonedNode, options);
      yield embedChildren(clonedNode, options);
    }
  });
}

// ../../node_modules/html-to-image/es/apply-style.js
init_esm_shims();
function applyStyle(node, options) {
  const { style } = node;
  if (options.backgroundColor) {
    style.backgroundColor = options.backgroundColor;
  }
  if (options.width) {
    style.width = `${options.width}px`;
  }
  if (options.height) {
    style.height = `${options.height}px`;
  }
  const manual = options.style;
  if (manual != null) {
    Object.keys(manual).forEach((key) => {
      style[key] = manual[key];
    });
  }
  return node;
}

// ../../node_modules/html-to-image/es/embed-webfonts.js
init_esm_shims();
var cssFetchCache = {};
function fetchCSS(url) {
  return __async(this, null, function* () {
    let cache2 = cssFetchCache[url];
    if (cache2 != null) {
      return cache2;
    }
    const res = yield fetch(url);
    const cssText = yield res.text();
    cache2 = { url, cssText };
    cssFetchCache[url] = cache2;
    return cache2;
  });
}
function embedFonts(data, options) {
  return __async(this, null, function* () {
    let cssText = data.cssText;
    const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
    const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
    const loadFonts = fontLocs.map((loc) => __async(this, null, function* () {
      let url = loc.replace(regexUrl, "$1");
      if (!url.startsWith("https://")) {
        url = new URL(url, data.url).href;
      }
      return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
        cssText = cssText.replace(loc, `url(${result})`);
        return [loc, result];
      });
    }));
    return Promise.all(loadFonts).then(() => cssText);
  });
}
function parseCSS(source) {
  if (source == null) {
    return [];
  }
  const result = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  let cssText = source.replace(commentsRegex, "");
  const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, "");
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
  const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
function getCSSRules(styleSheets, options) {
  return __async(this, null, function* () {
    const ret = [];
    const deferreds = [];
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray(sheet.cssRules || []).forEach((item, index) => {
            if (item.type === CSSRule.IMPORT_RULE) {
              let importIndex = index + 1;
              const url = item.href;
              const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
                try {
                  sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
                } catch (error) {
                  console.error("Error inserting rule from remote css", {
                    rule,
                    error
                  });
                }
              })).catch((e) => {
                console.error("Error loading remote css", e.toString());
              });
              deferreds.push(deferred);
            }
          });
        } catch (e) {
          const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
          if (sheet.href != null) {
            deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              inline.insertRule(rule, sheet.cssRules.length);
            })).catch((err) => {
              console.error("Error loading remote stylesheet", err);
            }));
          }
          console.error("Error inlining remote css file", e);
        }
      }
    });
    return Promise.all(deferreds).then(() => {
      styleSheets.forEach((sheet) => {
        if ("cssRules" in sheet) {
          try {
            toArray(sheet.cssRules || []).forEach((item) => {
              ret.push(item);
            });
          } catch (e) {
            console.error(`Error while reading CSS rules from ${sheet.href}`, e);
          }
        }
      });
      return ret;
    });
  });
}
function getWebFontRules(cssRules) {
  return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
}
function parseWebFontRules(node, options) {
  return __async(this, null, function* () {
    if (node.ownerDocument == null) {
      throw new Error("Provided element is not within a Document");
    }
    const styleSheets = toArray(node.ownerDocument.styleSheets);
    const cssRules = yield getCSSRules(styleSheets, options);
    return getWebFontRules(cssRules);
  });
}
function getWebFontCSS(node, options) {
  return __async(this, null, function* () {
    const rules = yield parseWebFontRules(node, options);
    const cssTexts = yield Promise.all(rules.map((rule) => {
      const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
      return embedResources(rule.cssText, baseUrl, options);
    }));
    return cssTexts.join("\n");
  });
}
function embedWebFonts(clonedNode, options) {
  return __async(this, null, function* () {
    const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : yield getWebFontCSS(clonedNode, options);
    if (cssText) {
      const styleNode = document.createElement("style");
      const sytleContent = document.createTextNode(cssText);
      styleNode.appendChild(sytleContent);
      if (clonedNode.firstChild) {
        clonedNode.insertBefore(styleNode, clonedNode.firstChild);
      } else {
        clonedNode.appendChild(styleNode);
      }
    }
  });
}

// ../../node_modules/html-to-image/es/index.js
function toSvg(_0) {
  return __async(this, arguments, function* (node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const clonedNode = yield cloneNode(node, options, true);
    yield embedWebFonts(clonedNode, options);
    yield embedImages(clonedNode, options);
    applyStyle(clonedNode, options);
    const datauri = yield nodeToDataURL(clonedNode, width, height);
    return datauri;
  });
}
function toCanvas(_0) {
  return __async(this, arguments, function* (node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const svg = yield toSvg(node, options);
    const img = yield createImage(svg);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const ratio = options.pixelRatio || getPixelRatio();
    const canvasWidth = options.canvasWidth || width;
    const canvasHeight = options.canvasHeight || height;
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    if (!options.skipAutoScale) {
      checkCanvasDimensions(canvas);
    }
    canvas.style.width = `${canvasWidth}`;
    canvas.style.height = `${canvasHeight}`;
    if (options.backgroundColor) {
      context.fillStyle = options.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  });
}
function toBlob(_0) {
  return __async(this, arguments, function* (node, options = {}) {
    const canvas = yield toCanvas(node, options);
    const blob = yield canvasToBlob(canvas);
    return blob;
  });
}

// ../../node_modules/d3plus-export/es/src/saveElement.js
var import_file_saver = __toESM(require_FileSaver(), 1);
var defaultOptions = {
  filename: "download",
  type: "png"
};
function saveElement_default(elem) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var renderOptions = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (!elem)
    return;
  options = Object.assign({}, defaultOptions, options);
  renderOptions = Object.assign({
    backgroundColor: renderOptions.background
  }, renderOptions);
  function finish(blob) {
    (0, import_file_saver.saveAs)(blob, "".concat(options.filename, ".").concat(options.type));
    if (options.callback)
      options.callback();
  }
  if (options.type === "svg") {
    toSvg(elem, renderOptions).then(function(dataUrl) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", dataUrl);
      xhr.responseType = "blob";
      xhr.onload = function() {
        return finish(xhr.response);
      };
      xhr.send();
    });
  } else {
    toBlob(elem, renderOptions).then(finish);
  }
}

// src/components/ErrorBoundary.tsx
init_esm_shims();
var ErrorBoundary = class extends React2.Component {
  constructor() {
    super(...arguments);
    this.state = {
      message: "",
      name: ""
    };
    this.clearError = () => this.setState({ message: "", name: "" });
  }
  static getDerivedStateFromError(error) {
    return { message: error.message, name: error.name };
  }
  render() {
    const { message, name } = this.state;
    if (!message) {
      return this.props.children;
    }
    return /* @__PURE__ */ React2.createElement(TranslationConsumer, null, ({ translate: t }) => {
      const detailText = t("error.detail");
      return /* @__PURE__ */ React2.createElement(Flex, { p: "xl", align: "center", justify: "center", direction: "column", className: "chart-card error" }, /* @__PURE__ */ React2.createElement(Title, { order: 3 }, t("error.title")), detailText.length ? /* @__PURE__ */ React2.createElement(Text, null, detailText) : null, /* @__PURE__ */ React2.createElement(Text, null, t("error.message", { message })), /* @__PURE__ */ React2.createElement(Group, { spacing: "xs", my: "sm" }, /* @__PURE__ */ React2.createElement(
        Button,
        {
          onClick: this.clearError,
          size: "xs",
          variant: "light"
        },
        t("action_retry")
      ), /* @__PURE__ */ React2.createElement(Button, { error: name, message })));
    });
  }
};

// src/components/ChartCard.tsx
var chartComponents = {
  barchart: BarChart,
  barchartyear: BarChart,
  donut: Donut,
  geomap: Geomap,
  histogram: BarChart,
  lineplot: LinePlot,
  pie: Pie,
  stacked: StackedArea,
  treemap: Treemap
};
var iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle
};
function ChartCard(props) {
  const { chart, currentChart, isSingleChart } = props;
  const isFocused = currentChart === chart.key;
  const { translate, locale } = useTranslation();
  const nodeRef = useRef(null);
  const ChartComponent = chartComponents[chart.chartType];
  const config = useMemo(() => createChartConfig(chart, {
    currentChart,
    isSingleChart,
    isUniqueChart: isSingleChart,
    measureConfig: props.measureConfig,
    showConfidenceInt: Boolean(props.showConfidenceInt),
    translate: (template, data) => translate(`vizbuilder.${template}`, data),
    userConfig: props.userConfig || {}
  }), [chart, isSingleChart, locale]);
  const downloadButtons = useMemo(() => {
    if (!isFocused && !isSingleChart)
      return [];
    const filename = (config.title instanceof Function ? config.title() : config.title).replace(/[^\w]/g, "_").replace(/[_]+/g, "_");
    return asArray(props.downloadFormats).map((format) => {
      const formatLower = format.toLowerCase();
      const Icon = iconByFormat[formatLower] || IconDownload;
      return /* @__PURE__ */ React2.createElement(
        Button,
        {
          compact: true,
          key: format,
          leftIcon: /* @__PURE__ */ React2.createElement(Icon, { size: 16 }),
          onClick: () => {
            const { current: boxElement } = nodeRef;
            const svgElement = boxElement && boxElement.querySelector("svg");
            svgElement && saveElement_default(svgElement, { filename, type: formatLower }, {
              background: getBackground(svgElement)
            });
          },
          size: "sm",
          variant: "light"
        },
        format.toUpperCase()
      );
    });
  }, [isFocused, isSingleChart, props.downloadFormats]);
  const focusButton = useMemo(() => {
    if (!isFocused && isSingleChart)
      return null;
    const Icon = isFocused ? IconArrowsMinimize : IconArrowsMaximize;
    return /* @__PURE__ */ React2.createElement(
      Button,
      {
        compact: true,
        leftIcon: /* @__PURE__ */ React2.createElement(Icon, { size: 16 }),
        onClick: props.onToggle,
        size: "sm",
        variant: isFocused ? "filled" : "light"
      },
      isFocused ? translate("vizbuilder.action_close") : translate("vizbuilder.action_enlarge")
    );
  }, [isFocused, isSingleChart, locale, props.onToggle]);
  const height = isFocused ? "calc(100vh - 3rem)" : isSingleChart ? "75vh" : 300;
  return /* @__PURE__ */ React2.createElement(Paper, { h: height, w: "100%", style: { overflow: "hidden" } }, /* @__PURE__ */ React2.createElement(ErrorBoundary, null, /* @__PURE__ */ React2.createElement(Stack, { spacing: 0, h: height, style: { position: "relative" }, w: "100%" }, /* @__PURE__ */ React2.createElement(Group, { position: "right", p: "xs", spacing: "xs", align: "center" }, downloadButtons, focusButton), /* @__PURE__ */ React2.createElement(Box, { style: { flex: "1 1 auto" }, ref: nodeRef, pb: "xs", px: "xs" }, /* @__PURE__ */ React2.createElement(ChartComponent, { config })))));
}
var getBackground = (node) => {
  if (node.nodeType !== Node.ELEMENT_NODE)
    return "white";
  const styles = window.getComputedStyle(node);
  const color = styles.getPropertyValue("background-color");
  return color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent" ? color : getBackground(node.parentNode);
};

// src/components/VizbuilderView.tsx
function createVizbuilderView(settings) {
  const {
    chartTypes,
    datacap,
    defaultLocale = "en",
    downloadFormats,
    nonIdealState: Notice = NonIdealState,
    showConfidenceInt = false,
    topojsonConfig,
    userConfig = {}
  } = settings;
  const getMeasureConfig = measureConfigAccessor(settings.measureConfig || {});
  const chartLimits = __spreadValues(__spreadValues({}, DEFAULT_CHART_LIMITS), settings.chartLimits);
  const chartGenOptions = { chartLimits, chartTypes, datacap, topojsonConfig };
  VizbuilderView.defaultProps = {
    version: "0.5.0"
  };
  return VizbuilderView;
  function VizbuilderView(props) {
    const { cube, panelKey, params, result } = props;
    const { actions, formatters } = useSettings();
    const [panelName, currentChart] = useMemo(() => `${panelKey || ""}-`.split("-"), [panelKey]);
    const resetCurrentPanel = useCallback(() => {
      actions.switchPanel(panelName);
    }, [panelName]);
    const charts = useMemo(() => generateCharts([{
      cube,
      dataset: result.data,
      params: {
        locale: params.locale || defaultLocale,
        booleans: params.booleans,
        cuts: mapActives(params.cuts, (item) => ({
          dimension: item.dimension,
          hierarchy: item.hierarchy,
          level: item.level,
          members: item.members
        })),
        drilldowns: mapActives(params.drilldowns, (item) => ({
          caption: item.captionProperty,
          dimension: item.dimension,
          hierarchy: item.hierarchy,
          level: item.level,
          properties: item.properties.map((item2) => item2.name)
        })),
        filters: mapActives(params.filters, (item) => ({
          constraint1: [item.conditionOne[0], item.conditionOne[2]],
          constraint2: item.conditionTwo ? [item.conditionTwo[0], item.conditionTwo[2]] : void 0,
          formatter: formatters[item.measure],
          joint: item.joint,
          measure: item.measure
        })),
        measures: mapActives(params.measures, (item) => ({
          formatter: formatters[item.name],
          measure: item.name
        }))
      }
    }], chartGenOptions), [cube, result.data, params]);
    const content = useMemo(() => {
      const isSingleChart = charts.length === 1;
      const chartMap = new Map(charts.map((item) => [item.key, item]));
      const filteredCharts = [...chartMap.values()];
      if (filteredCharts.length === 0)
        return /* @__PURE__ */ React2.createElement(Notice, null);
      return /* @__PURE__ */ React2.createElement(
        SimpleGrid,
        {
          breakpoints: [
            { minWidth: "xs", cols: Math.min(1, filteredCharts.length) },
            { minWidth: "md", cols: Math.min(2, filteredCharts.length) },
            { minWidth: "lg", cols: Math.min(3, filteredCharts.length) },
            { minWidth: "xl", cols: Math.min(4, filteredCharts.length) }
          ],
          className: clsx_m_default({ unique: filteredCharts.length === 1 })
        },
        filteredCharts.map(
          (chart) => /* @__PURE__ */ React2.createElement(
            ChartCard,
            {
              chart,
              currentChart: "",
              downloadFormats,
              isSingleChart,
              key: chart.key,
              measureConfig: getMeasureConfig,
              onToggle: () => {
                actions.switchPanel(`${panelName}-${chart.key}`);
              },
              showConfidenceInt,
              userConfig
            }
          )
        )
      );
    }, [currentChart, charts]);
    const focusContent = useMemo(() => {
      const chart = charts.find((chart2) => currentChart && chart2.key === currentChart);
      if (!chart)
        return null;
      return /* @__PURE__ */ React2.createElement(
        ChartCard,
        {
          chart,
          currentChart,
          downloadFormats,
          isSingleChart: true,
          key: `${chart.key}-focus`,
          measureConfig: getMeasureConfig,
          onToggle: resetCurrentPanel,
          showConfidenceInt,
          userConfig
        }
      );
    }, [currentChart, charts]);
    return /* @__PURE__ */ React2.createElement(Box, { className: props.className, p: "sm" }, content, /* @__PURE__ */ React2.createElement(
      Modal,
      {
        centered: true,
        onClose: resetCurrentPanel,
        opened: currentChart !== "",
        padding: 0,
        size: "calc(100vw - 3rem)",
        styles: {
          content: { maxHeight: "none !important" },
          inner: { padding: "0 !important" }
        },
        withCloseButton: false
      },
      focusContent
    ));
  }
}
function NonIdealState() {
  const { translate: t } = useTranslation();
  return /* @__PURE__ */ React2.createElement(Box, { className: "vizbuilder-nonidealstate" }, /* @__PURE__ */ React2.createElement(Title, { order: 1, className: "vizbuilder-nonidealstate-header" }, t("nonidealstate_msg")));
}
/*! Bundled license information:

file-saver/FileSaver.js:
  (*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js *)
*/

export { createVizbuilderView };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.esm.js.map