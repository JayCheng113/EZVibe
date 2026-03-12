import express from 'express';

const PORT = 3001;
const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`PTY Server starting on :${PORT}`);
});
