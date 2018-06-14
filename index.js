const path = require('path'),
  mustache = require('mustache'),
  fs = require('fs-extra');
  inquirer = require('inquirer');

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

function copyTemplate(params) {
  const cwd = process.cwd();
  const filePath = params.filePath.replace(params.templateDir,'');
  const targetDir = path.join(cwd, filePath);
  const fileContents = fs.readFileSync(params.filePath, 'utf8');
  const pkgName = params.answers.name;

  const contents = mustache.render(fileContents, params.answers);
  const outputPath = path.join(cwd, pkgName, filePath);
  console.log({outputPath, contents})
  fs.outputFileSync(outputPath, contents);
}

function npmInitBase(npmInit, templateDir) {
  const questions = toQuestions(npmInit);
  inquirer.prompt(questions).then(answers => {
    walkDir(templateDir, filePath => {
      copyTemplate({templateDir, filePath, answers})
    });
    return answers;
  }).then(answers => {
    console.log(mustache.render(npmInit.completeMessage, answers));
  }).catch(e => console.error(e) && process.exit(1));
}

const npmInit = require('./npm-init.json');
const templateDir = require('path').resolve('./template');

npmInitBase(npmInit, templateDir);
