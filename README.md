# create-with
Base code for `npm-init with`

* This repo. is the base code of `npm init with` or `npx create-with`.

## Usage
1. You can create your own npm-init template with two files with;

* `template` directory
* npm-init.json

2. Then, push to your github repository.
`$ git push`

3. Then, you are ready.
`$ npm init with myusername/my-template`

If you want it without your user name, e.g., `npm init with my-template`, 
it has to be under https://github.com/npm-init. 
Thus, pleae create an [issue](https://github.com/npm-init/create-with/issues) for it.

## Examples of `npm-init.json`
```
{
  "prompts": {
    "name": {
      "type": "string",
      "required": true,
      "message": "Project Name"
    },
    "description": {
      "type": "input",
      "required": true,
      "message": "Project Description"
    }
  },
  "completeMessage": "To get started:\n  cd {{name}}\n  npm install\n  npm start"
}
```

## Examples of `template` directory

`template` directory can have any file including any directory.
If your file contents to be dynamic, please build it as a mustache template

e.g. package.json
```
{
  "name": "{{name}}",
  "description": "{{description}}",
  "version": "0.0.0",
  "main": "dist/{{name}}.umd.js
}

## For Developers

```
$ node index.js allenhwkim/custom-element
```

MIT Licensed
