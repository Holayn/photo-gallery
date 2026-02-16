const express = require('express');

const AuthController = require('../controllers/auth');
const { getMemoriesIndex } = require('../services/memories');
const SourceService = require('../services/source');
const { UserDAO, UserSourceDAO } = require('../services/db');

const router = express.Router();

router.get(
  '/memories',
  AuthController.authAdmin,
  (req, res) => {
    const { username } = req.session;
    const user = UserDAO.getByUsername(username);

    try {
      const memoriesIndex = getMemoriesIndex();

      res.send({
        years: memoriesIndex.years.map(year => ({
          ...year,
          files: year.files
            .filter(file => UserSourceDAO.hasAccess(user.id, file.sourceId))
            .map(file => SourceService.getFile(file.sourceId, file.id)),
        })),
      });
    } catch (error) {
      res.sendStatus(400);
    }
  }
);

module.exports = router;
