#!/usr/bin/env node
/**
 * Migrates source-owned JSX copy to uiText without touching data values.
 *
 * Usage:
 *   node scripts/migrate-interface-jsx.mjs --dry-run
 *   node scripts/migrate-interface-jsx.mjs --apply
 *
 * JSXText, literal text attributes, and literal branches in JSX conditionals
 * are handled. Object/enum values and general JavaScript strings are left
 * alone. Each React component containing migrated UI text subscribes to the
 * selected interface language with useUiLanguage().
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const projectRoot = process.cwd();
const roots = ["client/src/pages", "client/src/components"];
const catalogPath = path.join(projectRoot, "client/src/i18n/interface/en.json");
const attrNames = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-valuetext",
  "caption",
  "cancelText",
  "confirmText",
  "description",
  "emptyMessage",
  "errorMessage",
  "helperText",
  "label",
  "noResultsText",
  "placeholder",
  "subtitle",
  "title",
  "tooltip",
]);
const candidates = new Set();
const dynamicCandidates = new Set();
const dryRun = process.argv.includes("--dry-run");
const apply = process.argv.includes("--apply");

if (dryRun === apply) {
  console.error("Choose exactly one of --dry-run or --apply.");
  process.exit(2);
}

function decodeJsxEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function displayText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isTechnical(value) {
  return /!\s*important|(?:^|\s)(?:transform|animation|background-color|border-color)\s*:/i.test(value)
    || /(?:^|\n)\s*[@.#][\w*-]+\s*[{,]/.test(value)
    || /--[\w-]+\s*:\s*[^;]+;/.test(value)
    || (value.includes("{") && value.includes(";"))
    || /\b(?:background|color|border|display|position|padding|margin|font-size|animation)\s*:\s*[^;]+;/i.test(value)
    || /^(?:"\s*)?(?:className|data-testid|disabled|placeholder|role|type|value|id|name|href|src|style)\s*=/i.test(value)
    || /^(?:autoComplete|autoCapitalize|spellCheck)\s*=/i.test(value)
    || /^data-\[[^\]]+\]/i.test(value)
    || /^language\.[A-Za-z]/.test(value)
    || /^\/(?:profile|messages|kliq|headlines|settings|admin|api)(?:\/.*)?$/i.test(value)
    || (/^\//.test(value) && value.includes("{{"))
    || /^(?:link|button|input|notification|data)-[\w-]*\{\{/.test(value)
    || ["{{value}}", "{{value}} {{value}}", "{{value}}{{value}}"].includes(value);
}

function quote(value) {
  return JSON.stringify(value);
}

function isInsideStyleElement(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isJsxElement(current) && current.openingElement.tagName.getText().toLowerCase() === "style") return true;
    current = current.parent;
  }
  return false;
}

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else if (/\.(?:tsx|jsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function hasJsx(node) {
  let found = false;
  function visit(current) {
    if (found) return;
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current) || ts.isJsxFragment(current)) {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  }
  visit(node);
  return found;
}

function hasOwnUseUiLanguage(node) {
  const body = functionBody(node);
  if (!body || !ts.isBlock(body)) return false;
  let found = false;
  function visit(current, isRoot = false) {
    if (found) return;
    if (!isRoot && (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current) || ts.isArrowFunction(current))) return;
    if (
      ts.isCallExpression(current)
      && ts.isIdentifier(current.expression)
      && current.expression.text === "useUiLanguage"
    ) {
      found = true;
      return;
    }
    ts.forEachChild(current, (child) => visit(child, false));
  }
  for (const statement of body.statements) visit(statement, true);
  return found;
}

function functionBody(node) {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return node.body;
  }
  return undefined;
}

function collectComponentFunctions(tree) {
  const components = [];
  function visit(node, parent) {
    if (
      ts.isFunctionDeclaration(node)
      && node.body
      && hasJsx(node.body)
      && (!node.name || /^[A-Z]/.test(node.name.text))
    ) {
      components.push(node);
    } else if (
      (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
      && node.body
      && hasJsx(node.body)
    ) {
      let ancestor = parent;
      while (
        ancestor
        && !ts.isVariableDeclaration(ancestor)
        && !ts.isExportAssignment(ancestor)
        && !ts.isStatement(ancestor)
        && !ts.isFunctionLike(ancestor)
      ) {
        ancestor = ancestor.parent;
      }
      const declaration = ancestor && ts.isVariableDeclaration(ancestor) ? ancestor : undefined;
      const variableName = declaration && ts.isIdentifier(declaration.name) ? declaration.name.text : "";
      if (/^[A-Z]/.test(variableName) || (ancestor && ts.isExportAssignment(ancestor))) components.push(node);
    }
    ts.forEachChild(node, (child) => visit(child, node));
  }
  visit(tree, undefined);
  return components;
}

function addImportEdits(tree, source, edits) {
  const imports = [];
  let hasUiText = false;
  let hasHook = false;
  for (const statement of tree.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== "@/i18n/interfaceText") continue;
    imports.push(statement);
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const item of bindings.elements) {
        if (item.name.text === "uiText") hasUiText = true;
        if (item.name.text === "useUiLanguage") hasHook = true;
      }
    }
  }

  if (imports.length) {
    const statement = imports[0];
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      const missing = [];
      if (!hasUiText) missing.push("uiText");
      if (!hasHook) missing.push("useUiLanguage");
      if (missing.length) {
        edits.push({
          start: bindings.end - 1,
          end: bindings.end - 1,
          text: `${bindings.elements.length ? ", " : ""}${missing.join(", ")}`,
        });
      }
    } else {
      const at = statement.getStart(tree);
      edits.push({
        start: at,
        end: at,
        text: `import { uiText, useUiLanguage } from "@/i18n/interfaceText";\n`,
      });
    }
  } else {
    const lastImport = tree.statements.filter(ts.isImportDeclaration).at(-1);
    const at = lastImport ? lastImport.end : 0;
    edits.push({
      start: at,
      end: at,
      text: `${at ? "\n" : ""}import { uiText, useUiLanguage } from "@/i18n/interfaceText";`,
    });
  }
}

function migrateFile(file) {
  const originalSource = fs.readFileSync(file, "utf8");
  let source = originalSource;
  let tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
  );
  const restoreEdits = [];
  function restoreUiTextCalls(node) {
    if (ts.isJsxAttribute(node) && !attrNames.has(node.name.getText(tree)) && node.initializer) {
      function restoreCalls(current) {
        if (current !== node.initializer && ts.isFunctionLike(current)) return;
        if (ts.isJsxElement(current) || ts.isJsxFragment(current) || ts.isJsxSelfClosingElement(current)) return;
        if (
          ts.isCallExpression(current)
          && ts.isIdentifier(current.expression)
          && current.expression.text === "uiText"
          && current.arguments.length === 1
          && ts.isStringLiteral(current.arguments[0])
        ) {
          restoreEdits.push({
            start: current.getStart(tree),
            end: current.end,
            text: quote(current.arguments[0].text),
          });
        }
        ts.forEachChild(current, restoreCalls);
      }
      restoreCalls(node.initializer);
    }
    ts.forEachChild(node, restoreUiTextCalls);
  }
  restoreUiTextCalls(tree);
  function findStyleTranslations(node) {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "uiText"
      && node.arguments[0]
      && ts.isStringLiteral(node.arguments[0])
      && isTechnical(node.arguments[0].text)
      && isInsideStyleElement(node)
    ) {
      restoreEdits.push({
        start: node.getStart(tree),
        end: node.end,
        text: quote(node.arguments[0].text),
      });
    }
    ts.forEachChild(node, findStyleTranslations);
  }
  findStyleTranslations(tree);
  restoreEdits.sort((a, b) => b.start - a.start);
  for (const edit of restoreEdits) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  if (restoreEdits.length) {
    tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
    );
  }
  const edits = [];
  const componentFunctions = collectComponentFunctions(tree);
  const newlyLocalizedPositions = [];
  const consumedChildren = new Set();
  let phraseCount = 0;

  function addPhrase(phrase, start, end, text) {
    if (!phrase || !/[\p{L}\p{N}]/u.test(phrase) || isTechnical(phrase)) return;
    edits.push({ start, end, text });
    candidates.add(phrase);
    newlyLocalizedPositions.push(start);
    phraseCount += 1;
  }

  function jsxTextReplacement(node) {
    if (isInsideStyleElement(node)) return;
    const raw = node.getText(tree);
    const decoded = decodeJsxEntities(raw);
    const phrase = displayText(decoded);
    if (!phrase) return;
    const leading = decoded.match(/^\s*/)?.[0] ?? "";
    const trailing = decoded.match(/\s*$/)?.[0] ?? "";
    const replacement = `${leading}{uiText(${quote(phrase)})}${trailing}`;
    addPhrase(phrase, node.getStart(tree), node.end, replacement);
  }

  function literalReplacement(node) {
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) return;
    const phrase = node.text;
    if (!displayText(phrase) || !/[\p{L}\p{N}]/u.test(phrase)) return;
    addPhrase(phrase, node.getStart(tree), node.end, `uiText(${quote(phrase)})`);
  }

  function migrateConditionalStrings(expression) {
    if (ts.isConditionalExpression(expression)) {
      migrateConditionalStrings(expression.whenTrue);
      migrateConditionalStrings(expression.whenFalse);
      return;
    }
    if (
      ts.isBinaryExpression(expression)
      && (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
        || expression.operatorToken.kind === ts.SyntaxKind.BarBarToken
        || expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
    ) {
      migrateConditionalStrings(expression.right);
      return;
    }
    literalReplacement(expression);
  }

  function simpleInterpolation(expression) {
    while (ts.isParenthesizedExpression(expression) || ts.isNonNullExpression(expression)) {
      expression = expression.expression;
    }
    if (ts.isIdentifier(expression)) return expression.text;
    if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
    return null;
  }

  function staticUiText(expression) {
    if (
      !ts.isCallExpression(expression)
      || !ts.isIdentifier(expression.expression)
      || expression.expression.text !== "uiText"
      || expression.arguments.length !== 1
      || !ts.isStringLiteral(expression.arguments[0])
    ) return null;
    return expression.arguments[0].text;
  }

  function childSegment(child) {
    if (ts.isJsxText(child)) return { kind: "text", value: decodeJsxEntities(child.getFullText(tree)) };
    if (!ts.isJsxExpression(child) || !child.expression) return null;
    const staticCopy = staticUiText(child.expression);
    if (staticCopy !== null) return { kind: "text", value: staticCopy };
    const name = simpleInterpolation(child.expression);
    if (!name) return null;
    return {
      kind: "value",
      name,
      expression: child.expression,
      source: child.expression.getText(tree),
    };
  }

  function migrateDynamicChildRuns(parent) {
    const children = parent.children;
    let index = 0;
    while (index < children.length) {
      if (!childSegment(children[index])) {
        index += 1;
        continue;
      }
      const segments = [];
      while (index < children.length) {
        const segment = childSegment(children[index]);
        if (!segment) break;
        segments.push({ ...segment, node: children[index] });
        index += 1;
      }

      const values = segments.filter((segment) => segment.kind === "value");
      const hasHumanCopy = segments.some((segment) => segment.kind === "text" && /[\p{L}\p{N}]/u.test(segment.value));
      if (!values.length || !hasHumanCopy) continue;

      const names = new Set();
      for (const value of values) {
        const base = value.name || "value";
        if (!names.has(base)) {
          value.key = base;
          names.add(base);
          continue;
        }
        const fullName = value.source.replace(/[^A-Za-z0-9_$]+/g, "_").replace(/^_+|_+$/g, "");
        let key = fullName || `${base}${names.size + 1}`;
        let suffix = 2;
        while (names.has(key)) key = `${fullName || base}${suffix++}`;
        value.key = key;
        names.add(key);
      }

      const valueQueue = [...values];
      let rawPhrase = "";
      for (const segment of segments) {
        rawPhrase += segment.kind === "text"
          ? segment.value
          : `{{${valueQueue.shift().key}}}`;
      }
      const phrase = displayText(rawPhrase)
        .replace(/\s+([,.;:!?%)\]])/g, "$1")
        .replace(/([(\[])\s+/g, "$1");
      if (!/[\p{L}\p{N}]/u.test(phrase) || isTechnical(phrase)) continue;

      const interpolationValues = values
        .map((value) => `${quote(value.key)}: ${value.source}`)
        .join(", ");
      const first = segments[0].node;
      const last = segments[segments.length - 1].node;
      const start = first.getStart(tree);
      addPhrase(
        phrase,
        start,
        last.end,
        `{uiText(${quote(phrase)}, { ${interpolationValues} })}`,
      );
      dynamicCandidates.add(phrase);
      for (const segment of segments) consumedChildren.add(segment.node);
      // The generated translation replaces the entire run, including the
      // static fragments which the first pass already wrapped individually.
      newlyLocalizedPositions[newlyLocalizedPositions.length - 1] = start;
    }
  }

  function findDynamicRuns(node) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) migrateDynamicChildRuns(node);
    ts.forEachChild(node, findDynamicRuns);
  }
  findDynamicRuns(tree);

  function visit(node) {
    if (consumedChildren.has(node)) return;
    if (ts.isJsxText(node)) {
      jsxTextReplacement(node);
    } else if (ts.isJsxAttribute(node) && attrNames.has(node.name.getText(tree)) && node.initializer) {
      if (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer)) {
        const value = node.initializer.text;
        if (displayText(value) && /[\p{L}\p{N}]/u.test(value)) {
          addPhrase(
            value,
            node.initializer.getStart(tree),
            node.initializer.end,
            `{uiText(${quote(value)})}`,
          );
        }
      }
    } else if (ts.isJsxExpression(node) && node.expression) {
      const expression = node.expression;
      const isVisibleChild = ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent);
      const isTextAttribute = ts.isJsxAttribute(node.parent)
        && attrNames.has(node.parent.name.getText(tree));
      if (
        !isInsideStyleElement(node)
        && (isVisibleChild || isTextAttribute)
        && (
        ts.isConditionalExpression(expression)
        || (
          ts.isBinaryExpression(expression)
          && (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
            || expression.operatorToken.kind === ts.SyntaxKind.BarBarToken
            || expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
        )
        || ts.isStringLiteral(expression)
        || ts.isNoSubstitutionTemplateLiteral(expression)
        )
      ) {
        migrateConditionalStrings(expression);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);

  if (!phraseCount) {
    if (apply && source !== originalSource) fs.writeFileSync(file, source);
    return { file, phraseCount: 0, changed: source !== originalSource };
  }

  // Each translated text call must belong to a subscribed component. Choose
  // the smallest component scope containing that call (nested renderers first).
  const scopesToSubscribe = new Set();
  for (const position of newlyLocalizedPositions) {
    const owner = componentFunctions
      .filter((component) => component.pos <= position && position < component.end)
      .sort((a, b) => (a.end - a.pos) - (b.end - b.pos))[0];
    if (owner && !hasOwnUseUiLanguage(owner)) scopesToSubscribe.add(owner);
  }

  for (const component of scopesToSubscribe) {
    const body = functionBody(component);
    if (!body) continue;
    if (ts.isBlock(body)) {
      edits.push({
        start: body.getStart(tree) + 1,
        end: body.getStart(tree) + 1,
        text: "\n  useUiLanguage();",
      });
    } else if (ts.isArrowFunction(component)) {
      edits.push({
        start: body.getStart(tree),
        end: body.getStart(tree),
        text: "{ useUiLanguage(); return ",
      });
      edits.push({
        start: body.end,
        end: body.end,
        text: "; }",
      });
    }
  }

  addImportEdits(tree, source, edits);
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let migrated = source;
  let lastStart = Infinity;
  let previousEdit;
  for (const edit of edits) {
    if (edit.end > lastStart) {
      throw new Error(`Overlapping edits detected in ${file}: ${JSON.stringify({ edit, previousEdit })}`);
    }
    migrated = migrated.slice(0, edit.start) + edit.text + migrated.slice(edit.end);
    lastStart = edit.start;
    previousEdit = edit;
  }

  const relative = path.relative(projectRoot, file);
  if (apply) fs.writeFileSync(file, migrated);
  return { file: relative, phraseCount, changed: migrated !== source };
}

const files = roots.flatMap((root) => walkFiles(path.join(projectRoot, root))).sort();
const results = files.map(migrateFile);
const changed = results.filter((result) => result.changed);

if (apply) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const scannerInventory = JSON.parse(
    execFileSync(process.execPath, ["scripts/localize-interface.mjs"], { cwd: projectRoot, encoding: "utf8" }),
  );
  for (const phrase of Object.keys(scannerInventory)) candidates.add(phrase);
  for (const key of Object.keys(catalog)) {
    if (isTechnical(key)) delete catalog[key];
  }
  for (const phrase of [...candidates].sort((a, b) => a.localeCompare(b))) {
    if (isTechnical(phrase)) continue;
    if (!(phrase in catalog)) catalog[phrase] = phrase;
  }
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  filesScanned: files.length,
  filesChanged: changed.length,
  jsxAndAttributePhrases: [...candidates].length,
  dynamicTemplates: [...dynamicCandidates],
  inventoryMerged: apply,
  changedFiles: changed.map(({ file, phraseCount }) => ({ file, phraseCount })),
}, null, 2));
