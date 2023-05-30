# platefulai

try it out

- clone the repo: `git clone https://github.com/tatsuyak90/platefulai`
- run the server:
```
cd platefulai/platefulai-api
npm i
# here, you need to create a `.env` file in the platefulai-api folder with contents `ANTHROPIC_API_KEY=your_key_here`
(not `key.env`, not `word.env`, the filename literally starts with a dot)
# once that is done, run:
node index.js
```
- run the frontend: navigate to platefulai/platefulai-fe, run `npm i && npm start`
