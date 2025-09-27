const express = require('express');
const RSSFeed = require('../models/RSSFeed');

const router = express.Router();

// Get all RSS feeds
router.get('/', async (req, res) => {
  try {
    const feeds = await RSSFeed.find({ isActive: true }).sort({ industry: 1, name: 1 });
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feeds by industry
router.get('/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    const feeds = await RSSFeed.find({ 
      industry, 
      isActive: true 
    }).sort({ name: 1 });
    
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new RSS feed
router.post('/', async (req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const { name, url, website, industry, scrapeFrequency } = req.body;

    const feed = new RSSFeed({
      name,
      url,
      website,
      industry,
      scrapeFrequency: scrapeFrequency || 'hourly'
    });

    await feed.save();
    res.status(201).json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update feed
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const feed = await RSSFeed.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete feed
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const feed = await RSSFeed.findByIdAndDelete(id);
    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    res.json({ message: 'Feed deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
