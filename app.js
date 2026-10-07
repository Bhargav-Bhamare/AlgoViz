const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// Algorithm engines are UMD modules: the same file runs in Node and the browser.
app.use('/engines', express.static(path.join(__dirname, 'algorithms')));
app.use('/', require('./routes/algorithmRoutes'));
app.use((req, res) => res.status(404).send('Page not found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DAA Lab running at http://localhost:${PORT}`));
