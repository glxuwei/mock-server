const express = require('express');
const childProcess = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const TEMPLATE = `module.exports = ({ method, query, params, body }) => {
  return {
    code: 0,
    data: {
    },
    message: '',
  }
}`;

const delay = (fn) => (...args) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fn.apply(null, args));
    }, Math.random * 1000);
  });
};

const getFilePath = (dir) => path.resolve(__dirname, dir, 'index.js');

async function writeFile(filePath, content) {
  try {
    await fs.access(filePath);
    return;
  } catch (error) {
    const dirPath = path.dirname(filePath);
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (mkdirError) {
      // 如果文件夹创建失败，可能是文件夹已存在
      if (mkdirError.code !== 'EEXIST') {
        throw mkdirError;
      }
    }
  }
  return await fs.writeFile(filePath, content || TEMPLATE, 'utf8');
}

async function navigateHandler(req, res, filePath) {
  let content = '';
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch(e) {
  }
  if (!content) {
    content = TEMPLATE;
    await writeFile(filePath, content);
  }
  childProcess.exec(`cursor ${filePath}`, (error) => {
    if (error) {
      childProcess.exec(`code ${filePath}`, (err) => {
        if (err) {
          res.render('index', {
            title: '',
            content,
          });
        }
      })
    }
  });
};

const handler = async (req, res) => {
  const headers = req.headers;
  const fileDir = `../mock${req.path}`;
  const filePath = getFilePath(fileDir);
  if (headers['sec-fetch-mode'] === 'navigate' || !headers.referer) {
    navigateHandler(req, res, filePath);
    return;
  }
  const { type, value = '' } = req.body || {};
  if (type === res.locals.HANDLE_TYPE) {
    let content = value.trim();
    if (!content.replace(/\s*[\n\t][;]?\s*/g, '')) {
      content = TEMPLATE;
    }
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ code: 0 });
    return;
  }
  await writeFile(filePath);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    if (/^\s*{[\s\S]*}\s*$/.test(data)) {
      res.json(JSON.parse(data));
      return;
    }
  } catch(e) {
    res.json(e);
    return;
  }
  res.json(await delay(require(fileDir))(req));
};

router.get('/*', handler);
router.post('/*', handler);

module.exports = router;

