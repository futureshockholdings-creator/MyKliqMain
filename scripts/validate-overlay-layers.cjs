const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const postcss = require("postcss");
const tailwind = require("tailwindcss");

const read = path => fs.readFileSync(path, "utf8");
const configModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(read("tailwind.config.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: configModule.exports, module: configModule, require });
const config = configModule.exports.default;
const ui = name => read(`client/src/components/ui/${name}.tsx`);

test("popup priority exceeds navigation and install banners, with menus above modals", () => {
  const layers = config.theme.extend.zIndex;
  assert.ok(50 < 9999 && 9999 < Number(layers.modal));
  assert.ok(Number(layers.modal) < Number(layers.popup));
  assert.ok(Number(layers.popup) < Number(layers.tooltip));
  assert.ok(Number(layers.tooltip) < Number(layers.toast));
});

test("every shared modal uses foreground layers for its backdrop and content", () => {
  for (const name of ["dialog", "alert-dialog", "sheet", "drawer"]) {
    assert.equal((ui(name).match(/z-modal/g) || []).length, 2, name);
    assert.match(ui(name), /Portal>/, name);
    assert.match(ui(name), /overflow-y-auto/, name);
  }
});

test("toast feedback escapes transformed/clipped layouts and wraps long text", () => {
  assert.match(ui("overlay-portal"), /createPortal\(children, document\.body\)/);
  assert.match(ui("toaster"), /<OverlayPortal>/);
  assert.match(ui("toaster"), /min-w-0/);
  assert.match(ui("toaster"), /overflow-wrap:anywhere/);
  assert.match(ui("toast"), /z-toast/);
  assert.match(ui("toast"), /100vw_-_2rem/);
  assert.match(ui("toast"), /100dvh_-_2rem/);
});

test("menus, tooltips and hover cards stay above dialog surfaces", () => {
  for (const name of ["popover", "dropdown-menu", "select", "context-menu", "hover-card"]) {
    assert.match(ui(name), /z-popup/, name);
    assert.match(ui(name), /Portal>/, name);
  }
  assert.match(ui("tooltip"), /z-tooltip/);
  assert.match(ui("tooltip"), /TooltipPrimitive.Portal>/);
});

test("photo/video upload dialogs share the corrected modal primitive", () => {
  for (const name of ["MediaUpload", "SmartVideoUploader", "VideoConversionUpload"]) {
    const source = read(`client/src/components/${name}.tsx`);
    assert.match(source, /from ["']@\/components\/ui\/dialog["']/);
    assert.match(source, /<DialogContent/);
  }
  for (const name of ["NotificationPanel", "ImageViewer", "ConversionGuide"]) {
    const source = read(`client/src/components/${name}.tsx`);
    assert.match(source, /<OverlayPortal>/, name);
    assert.match(source, /z-modal/, name);
  }
});

test("generated CSS actually emits the layers and valid mobile viewport calculations", async () => {
  const files = ["toast", "dialog", "alert-dialog", "sheet", "drawer", "popover", "dropdown-menu", "select", "context-menu", "tooltip", "hover-card"];
  const result = await postcss([tailwind({
    ...config,
    content: [{ raw: files.map(ui).join("\n"), extension: "tsx" }],
  })]).process("@tailwind utilities;", { from: undefined });
  const rules = new Map();
  const order = [];
  result.root.walkRules(rule => { rules.set(rule.selector, rule); order.push(rule.selector); });
  for (const [name, value] of Object.entries(config.theme.extend.zIndex)) {
    const rule = rules.get(`.z-${name}`);
    assert.ok(rule, `Missing generated z-${name}`);
    assert.equal(rule.nodes.find(node => node.prop === "z-index").value, value);
    assert.ok(order.indexOf(`.z-${name}`) > order.indexOf(".z-50"));
  }
  const css = result.css;
  assert.match(css, /width: calc\(100vw - 2rem\)/);
  assert.match(css, /max-height: calc\(100dvh - 2rem\)/);
});
