import express from 'express';
const app = express();

app.get('/', (req, res) => res.send('ZEUS Executor está ativo.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
