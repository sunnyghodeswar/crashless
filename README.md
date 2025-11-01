# ⚡ Crashless
> Stability, security, and smart logging for Express.

## Install
```bash
npm install crashless
```

## Usage
```js
import express from 'express';
import crashless from 'crashless';

const app = express();
app.use(crashless({ handleAsync: true }));

app.get('/', async (req, res) => {
  throw crashless.createError('Something went wrong!', 500, 'ERR_OOPS');
});
```

MIT © Sunny Ghodeswar
