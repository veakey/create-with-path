#!/usr/bin/env node

const path = require('path');
const mustache = require('mustache');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

console.log('process.argv', process.argv);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
};

function toQuestions(npmInit) {
  const questions = [];
  for (var key in npmInit.prompts) {
    let question = npmInit.prompts[key];
    question.name = key;
    if (question.required) {
      question.validate = val => Promise.resolve(!!val);
    }
    if (question.type === 'string') {
      question.type = 'input';
      question.filter = val => Promise.resolve(val.toLowerCase().replace(/\s+/g, '-'));   
    }
    questions.push(question);
  }
  return questions;
}

/**
 * params {
 *   templateDir, filePath, answers  
 * }
 */
function copyTemplate(params) {
  const cwd = process.cwd();
  const filePath = params.filePath.replace(params.templateDir,'');
  const targetDir = path.join(cwd, filePath);
  const fileContents = fs.readFileSync(params.filePath, 'utf8');
  const pkgName = params.answers.name;

  const contents = mustache.render(fileContents, params.answers);
  const outputPath = path.join(cwd, pkgName, filePath);
  fs.outputFileSync(outputPath, contents);
}

function npmInitPkg(npmInitFile, templateDir) {
  npmInit = JSON.parse(fs.readFileSync(npmInitFile, 'utf8'));
  const questions = toQuestions(npmInit);
  return inquirer.prompt(questions).then(answers => {
      walkDir(templateDir, filePath => {
        copyTemplate({templateDir, filePath, answers})
      });
      return answers;
    }).then(answers => {
      console.info(mustache.render(npmInit.completeMessage, answers));
    }).catch(e => console.error(e) && process.exit(1));
}

async function run() {
  const tmpDir = path.join(process.cwd(), '.tmp');
  fs.removeSync(tmpDir);
  const gitUrl = `https://github.com/${process.argv[2]}`;
  const { stdout, stderr } = await exec(`git clone ${gitUrl} ${tmpDir}`);

  const npmInitFile = path.join(tmpDir, 'npm-init.json');
  const templateDir = path.join(tmpDir, 'template');

  await npmInitPkg(npmInitFile, templateDir);
  fs.removeSync(tmpDir);
}

run();
