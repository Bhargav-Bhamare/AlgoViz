const algorithms = require('../algorithms/registry');
const categories = ['All', 'Sorting', 'Divide & Conquer', 'Greedy', 'Dynamic Programming', 'Backtracking', 'Branch & Bound', 'Graph Algorithms'];

exports.home = (req, res) => res.render('home', { algorithms, categories, title: 'DAA Lab' });

exports.show = (req, res) => {
  const algo = algorithms.find(a => a.slug === req.params.slug);
  if (!algo) return res.status(404).send('Algorithm not found');
  res.render('algorithm', { algo, title: algo.name });
};

exports.random = (req, res) => {
  const ready = algorithms.filter(a => a.available);
  res.redirect('/algorithm/' + ready[Math.floor(Math.random() * ready.length)].slug);
};
