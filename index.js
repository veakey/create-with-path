#!/usr/bin/env node

const path = require('path');
const mustache = require('mustache');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

run();

async function run() {
  const gitRepo = await getGitRepo(process.argv[2]);
  const tmpDir = path.join(process.cwd(), '.tmp');
  fs.removeSync(tmpDir);

  const { stdout, stderr } = await exec(`git clone ${gitRepo} ${tmpDir}`);

  const npmInitFile = path.join(tmpDir, 'npm-init.json');
  const templateDir = path.join(tmpDir, 'template');
  try {
    await npmInitPkg(npmInitFile, templateDir);
  } catch(e) {
    console.error(e);
  } finally {
    fs.removeSync(tmpDir);
  }
}

// check if repo exists and has npm-init.json and template directory
async function getGitRepo(arg) {
  const gitRepo = arg.match(/\//) ? arg : `npm-init/${arg}` ;

  // if (arg) {
  //   const argGitRepo = arg.match(/\//) ? arg : `npm-init/${arg}`;
  //   const gitRepoUrl = `https://github.com/${argGitRepo}`;
  //   const gitRepoApiUrl = `https://api.github.com/repos/${argGitRepo}`;
  //
  //   let res1 = await fetch(gitRepoApiUrl);
  //   let res2 = await fetch(gitRepoApiUrl + '/contents/npm-init.json');
  //   let res3 = await fetch(gitRepoApiUrl + '/contents/template');
  //   if (res1.ok && res2.ok && res3.ok) {
  //     gitRepo = argGitRepo;
  //   } else {
  //     console.error('Error: Invalid git repo. In must have npm-init.json and template directory.');
  //   }
  // }

  console.log('getGitRepo > ', gitRepo)

  return gitRepo;
}

function npmInitPkg(npmInitFile, templateDir) {
  npmInit = JSON.parse(fs.readFileSync(npmInitFile, 'utf8'));

  const questions = getQuestions(npmInit);
  return inquirer.prompt(questions).then(answers => {
    console.log('processing ... ', answers);
    walkDir(templateDir, filePath => {
      copyTemplate({templateDir, filePath, answers, npmInit})
    });
    return answers;
  }).then(answers => {
    console.info(mustache.render(npmInit.completeMessage, answers));
  }).catch(e => console.error(e) && process.exit(1));
}

function getQuestions(npmInit) {
  const defaultPrompts = {
    projectName: {
      type: 'string',
      required: true,
      default: 'my-awesome-project',
      message: 'Project Name'
    }
  };
  const prompts = Object.assign({}, defaultPrompts, npmInit.prompts);
  const questions = [];
  for (var key in prompts) {
    let question = prompts[key];
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
 * params { templateDir, filePath, answers, npmInit }
 */
function copyTemplate(params) {
  const cwd = process.cwd();
  const filePath = params.filePath.replace(params.templateDir,'');
  const targetDir = path.join(cwd, filePath);
  const fileContents = fs.readFileSync(params.filePath, 'utf8');
  const pkgName = params.answers.name || params.answers.projectName;

  const outputPath = path.join(cwd, pkgName, filePath);
  try {
    const outputContents = mustache.render(fileContents, params.answers);
    fs.outputFileSync(outputPath, outputContents);
  } catch (e) {
    const outputContents = fileContents;
    fs.outputFileSync(outputPath, outputContents);
  }
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ?
        walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
};

