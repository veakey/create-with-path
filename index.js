#!/usr/bin/env node
// $ node index.js allenhwkim/custom-element

const path = require('path');
const mustache = require('mustache');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fetch = require('node-fetch');

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
 * copy files from template to project directory 
 * params { templateDir, filePath, answers  }
 */
function copyTemplate(params) {
  const cwd = process.cwd();
  const filePath = params.filePath.replace(params.templateDir,'');
  const targetDir = path.join(cwd, filePath);
  const fileContents = fs.readFileSync(params.filePath, 'utf8');
  const pkgName = params.answers.name;

  const outputPath = path.join(cwd, pkgName, filePath);
  let contents = fileContents;
  for (var key in params.answers) {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
    contents = contents.replace(regex, params.answers[key]);
  }

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
  let gitRepo = process.argv[2];
  fs.removeSync(tmpDir);

  try {
    if (gitRepo) {
      gitRepo = gitRepo.match(/\//) ? gitRepo : `allenhwkim/${gitRepo}`;
      const gitRepoUrl = `https://github.com/${gitRepo}`;
      const gitRepoApiUrl = `https://api.github.com/repos/${gitRepo}`;

      // check if repo exists and has npm-init.json and template directory
      let res = await fetch(gitRepoApiUrl);
      if (!res.ok) throw 'Error: Invalid git repo.';
      res = await fetch(gitRepoApiUrl + '/contents/npm-init.json');
      if (!res.ok) throw 'Error: Cannot find npm-init.json';
      res = await fetch(gitRepoApiUrl + '/contents/template');
      if (!res.ok) throw 'Error: Cannot find template directory';

    } else {
      throw 'Error: git repository to initialize with. e.g. `npm init with custom-element`';
    }
    
    const gitRepoUrl = `https://github.com/${gitRepo}`;
    const { stdout, stderr } = await exec(`git clone ${gitRepoUrl} ${tmpDir}`);

    const npmInitFile = path.join(tmpDir, 'npm-init.json');
    const templateDir = path.join(tmpDir, 'template');

    await npmInitPkg(npmInitFile, templateDir);
  } catch(e) {
    console.error(e);
  } finally {
    fs.removeSync(tmpDir);
  }
}

run();
