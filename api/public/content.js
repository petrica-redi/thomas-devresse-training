const { loadSiteData } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    const data = await loadSiteData();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load content', default: require('../lib/store').getDefaultData() });
  }
};
