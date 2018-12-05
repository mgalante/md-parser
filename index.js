const filesTree = require('files-tree');
const path = require('path');
const fs = require('fs');

const ROOT = './test';

let tree = filesTree.tree(ROOT);

let elements = [];

function readHeaders(tree) {
  for (let element of tree) {
    if (element.directory) {
      readHeaders(element.list);
    } else if (path.extname(element.name) === '.md') {
      readHeader(element);
    }
  }
}

const startComment = /<!--/;
const endComment = /-->/;

function readHeader(element) {
  const content = fs.readFileSync(element.path, { encoding: 'utf-8' });
  const lines = content.replace(/\r\n/gm, '\n').split('\n');
  let inComment = false;

  element.metadata = {
    parent: null,
    order: Number.MAX_SAFE_INTEGER,
    id: null
  };

  for (const line of lines) {
    if (!inComment && startComment.test(line)) {
      inComment = true;
      continue;
    }

    if (inComment) {
      if (endComment.test(line)) {
        inComment = false;
        break;
      }

      const extract = /^([^:]+)[:]([^:]+)$/gm.exec(line);

      if (extract) {
        const key = extract[1].trim();
        const value = extract[2].trim();
        element.metadata[key] = value
          .split(',')
          .map(x => x.trim())
          .filter(x => x !== '');
      }
    }
  }
  elements.push({
    file: element.path,
    ...element.metadata,
    id: element.metadata.id[0],
    parent: element.metadata.parent && element.metadata.parent[0]
  });
}

readHeaders(tree);
//console.log(elements);

elements.forEach(parentElement => {
  parentElement.children = elements.filter(
    element => element.parent === parentElement.id
  );
});

const menu = elements
  .filter(element => element.parent === null)
  .sort((a, b) => a.order > b.order);

console.log(JSON.stringify(siteMap, null, 4));
