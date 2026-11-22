#!/usr/bin/env node
/**
 * Source-based interface string inventory for MyKliq.
 *
 * This deliberately does not mutate application source or member content. Run
 * it from the repository root to emit the current English interface inventory:
 *   node scripts/localize-interface.mjs > /tmp/interface-inventory.json
 *
 * JSX text and user-facing accessibility/form attributes are collected from
 * pages and shared TSX components. Class names, test IDs, enum/storage values,
 * URLs, and strings nested in non-UI attributes are excluded. The result is
 * intended for review before adding missing phrases to i18n/interface/en.json.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots = ["client/src/pages", "client/src/components", "client/src/hooks"];
const textAttributes = new Set([
  "alt",
  "aria-label",
  "aria-description",
  "placeholder",
  "title",
]);
const messageCallNames = new Set([
  "toast",
  "success",
  "error",
  "warning",
  "info",
  "setError",
  "setStatusMessage",
  "uiText",
]);
const validationMethods = new Set(["min", "max", "email", "url", "regex", "nonempty", "positive", "int"]);
const phrases = new Set();

function isTechnical(phrase) {
  return /!\s*important|(?:^|\s)(?:transform|animation|background-color|border-color)\s*:/i.test(phrase)
    || /(?:^|\n)\s*[@.#][\w*-]+\s*[{,]/.test(phrase)
    || /--[\w-]+\s*:\s*[^;]+;/.test(phrase)
    || (phrase.includes("{") && phrase.includes(";"))
    || /\b(?:background|color|border|display|position|padding|margin|font-size|animation)\s*:\s*[^;]+;/i.test(phrase)
    || /^(?:"\s*)?(?:className|data-testid|disabled|placeholder|role|type|value|id|name|href|src|style)\s*=/i.test(phrase)
    || /^(?:autoComplete|autoCapitalize|spellCheck)\s*=/i.test(phrase)
    || /^data-\[[^\]]+\]/i.test(phrase)
    || /^language\.[A-Za-z]/.test(phrase)
    || /^\/(?:profile|messages|kliq|headlines|settings|admin|api)(?:\/.*)?$/i.test(phrase)
    || (/^\//.test(phrase) && phrase.includes("{{"))
    || /^(?:link|button|input|notification|data)-[\w-]*\{\{/.test(phrase)
    || ["{{value}}", "{{value}} {{value}}", "{{value}}{{value}}"].includes(phrase);
}

function add(value) {
  const phrase = value.replace(/\s+/g, " ").trim();
  if (
    phrase
    && /[\p{L}\p{N}]/u.test(phrase)
    && !/^\[[A-Za-z][A-Za-z0-9 _-]*\]\s*(?:Error|Failed|CRITICAL|Network)/.test(phrase)
    && !/^(?:https?:\/\/|\/api\/|data-testid|button-|input-|queryKey)/i.test(phrase)
    && !/^(?:@(?:keyframes|media|supports)|[.#][\w-]*\s*\{|--[\w-]+|[\w-]+\s*:\s*[^ ]+;)/i.test(phrase)
    && !isTechnical(phrase)
    && !/^\d+(?:\.\d+)?(?:%|px|fps|MB|ms)?$/i.test(phrase)
  ) phrases.add(phrase);
}

function templatePhrase(node, tree) {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return null;
  let phrase = node.head.text;
  for (const span of node.templateSpans) {
    const expression = span.expression.getText(tree);
    const lastPart = expression.split(/[.\[]/).pop().replace(/['"\]]/g, "");
    const label = /^[A-Za-z_$][\w$]*$/.test(lastPart) ? lastPart : "value";
    phrase += `{{${label}}}${span.literal.text}`;
  }
  return phrase;
}

function scanFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function visit(node) {
    if (ts.isJsxText(node)) {
      add(node.getFullText(tree));
    } else if (
      ts.isPropertyAssignment(node)
      && node.name.getText(tree).replace(/^['"]|['"]$/g, "") === "label"
      && (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      // Option/tab/form labels are source-owned copy even when rendered via
      // option.label instead of literal JSXText.
      add(node.initializer.text);
    } else if (ts.isJsxAttribute(node) && textAttributes.has(node.name.getText(tree))) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer)) add(initializer.text);
      else if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
        const phrase = templatePhrase(initializer.expression, tree);
        if (phrase) add(phrase);
      }
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isConsoleLog = ts.isPropertyAccessExpression(callee)
        && ts.isIdentifier(callee.expression)
        && callee.expression.text === "console";
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : "";
      if (!isConsoleLog && messageCallNames.has(name)) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg)) add(arg.text);
          else {
            const phrase = templatePhrase(arg, tree);
            if (phrase) add(phrase);
          }
          if (ts.isObjectLiteralExpression(arg)) {
            for (const prop of arg.properties) {
              if (!ts.isPropertyAssignment(prop)) continue;
              const key = prop.name.getText(tree).replace(/^['"]|['"]$/g, "");
              if (!["title", "description"].includes(key)) continue;
              if (ts.isStringLiteral(prop.initializer)) add(prop.initializer.text);
              else {
                const phrase = templatePhrase(prop.initializer, tree);
                if (phrase) add(phrase);
              }
            }
          }
        }
      }
      if (!isConsoleLog && validationMethods.has(name)) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg)) add(arg.text);
          else {
            const phrase = templatePhrase(arg, tree);
            if (phrase) add(phrase);
          }
        }
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      let current = node.parent;
      let inJsxChild = false;
      while (current && !ts.isSourceFile(current)) {
        if (ts.isJsxAttribute(current)) {
          inJsxChild = textAttributes.has(current.name.getText(tree));
          break;
        }
        if (ts.isJsxExpression(current)) {
          inJsxChild = true;
          current = current.parent;
          continue;
        }
        if (ts.isJsxElement(current) || ts.isJsxFragment(current)) break;
        current = current.parent;
      }
      if (inJsxChild) {
        const phrase = templatePhrase(node, tree);
        if (phrase) add(phrase);
        else if (ts.isStringLiteral(node)) add(node.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(tree);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && (file.endsWith(".tsx") || (directory === "client/src/hooks" && file.endsWith(".ts")))) scanFile(file);
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}

const inventory = Object.fromEntries(
  [...phrases].sort((a, b) => a.localeCompare(b, "en")).map((phrase) => [phrase, phrase]),
);
process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
