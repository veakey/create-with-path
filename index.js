#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];
if (!packageName) {
  console.error('Please enter the package name you want to create');
  process.exit(1);
}

function outputFileSync (file, ...args) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    dir.split(path.sep).reduce((currentPath, folder) => {
      currentPath += folder + path.sep;
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath);
      }
      return currentPath;
    }, '');
  }
  fs.writeFileSync(file, ...args)
}

function walkDir(dir, runIt) {
  fs.readdirSync(dir).forEach( f => {
    if (fs.statSync(path.join(dir, f)).isDirectory()) {
      walkDir(path.join(dir, f), runIt);
    } else {
      runIt(path.join(dir, f));
    }
  });
};

//write files from template directory
walkDir(path.resolve(path.join(__dirname, 'template')), function(filePath) {
  const cwd = process.cwd();
  const newPath = filePath.replace(new RegExp('.*template'+path.sep),'');
  const newFilePath = path.join(cwd, packageName, newPath);
  const contents = fs.readFileSync(filePath, 'utf8');
  outputFileSync(newFilePath, contents); 
});
