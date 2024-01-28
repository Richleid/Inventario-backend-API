const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./routes/index.js'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at: http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Welcome to Inventario API-REST!!');
});




