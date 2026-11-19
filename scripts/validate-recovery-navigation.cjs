const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function parse(path) {
  return ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function nodes(root, predicate) {
  const matches = [];
  function visit(node) {
    if (predicate(node)) matches.push(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
  return matches;
}

function attribute(element, name) {
  return element.attributes.properties.find(prop => prop.name?.getText() === name);
}

function loginLink(root, label) {
  return nodes(root, node => ts.isJsxElement(node) &&
    node.openingElement.tagName.getText() === 'Link' &&
    attribute(node.openingElement, 'href')?.initializer?.text === '/login' &&
    node.children.some(child => ts.isJsxText(child) && child.text.trim() === label));
}

test('password recovery returns directly to the login route without logging out', () => {
  const root = parse('client/src/pages/forgot-password.tsx');
  const links = loginLink(root, 'Back to Log In');
  assert.equal(links.length, 1);
  const button = links[0].parent;
  assert.equal(button.openingElement.tagName.getText(), 'Button');
  assert.ok(attribute(button.openingElement, 'asChild'));
  assert.equal(attribute(button.openingElement, 'onClick'), undefined);
  assert.doesNotMatch(root.text, /\/api\/logout/);
});

test('shared 404 page contains a clickable Home link to login', () => {
  const links = loginLink(parse('client/src/pages/not-found.tsx'), 'Home');
  assert.equal(links.length, 1);
  assert.equal(links[0].parent.openingElement.tagName.getText(), 'Button');
  assert.ok(attribute(links[0].parent.openingElement, 'asChild'));
});

test('the login destination exists and unknown routes use the shared 404 page', () => {
  const root = parse('client/src/App.tsx');
  const routes = nodes(root, node => ts.isJsxSelfClosingElement(node) && node.tagName.getText() === 'Route');
  assert.ok(routes.some(route => attribute(route, 'path')?.initializer?.text === '/login' &&
    attribute(route, 'component')?.initializer?.getText() === '{Login}'));
  assert.ok(routes.some(route => !attribute(route, 'path') &&
    attribute(route, 'component')?.initializer?.getText() === '{NotFound}'));
});
