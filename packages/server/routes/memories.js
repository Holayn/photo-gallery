const express = require('express');

const AuthController = require('../controllers/auth');
const { getMemoriesIndex } = require('../services/memories');
const SourceService = require('../services/source');

const router = express.Router();

router.get(
  '/memories',
  AuthController.authAdmin,
  (req, res) => {
    try {
      const memoriesIndex = getMemoriesIndex();

      res.send({
        years: memoriesIndex.years.map(year => ({
          ...year,
          files: year.files.map(file => SourceService.getFile(file.sourceId, file.id)),
        })),
      });
    } catch (error) {
      res.sendStatus(400);
    }
  }
);

module.exports = router;
