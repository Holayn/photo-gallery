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
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      res.status(400).send('Failed to find user from session');
    }

    try {
      const memoriesIndex = getMemoriesIndex();

      const { year: yearParam } = req.query;
      const memoryYears = yearParam
        ? memoriesIndex.years.filter(year => String(year.year) === String(yearParam))
        : memoriesIndex.years;

      let years = memoryYears.map(year => ({
          ...year,
          files: year.files
            .filter(file => UserSourceDAO.hasAccess(user.id, file.sourceId))
            .map(file => SourceService.getFile(file.sourceId, file.id)),
        }));

      years = years.filter(year => year.files.length > 0);

      res.send({
        years,
      });
    } catch (error) {
      res.sendStatus(400);
    }
  }
);

router.get(
  '/memories/covers',
  AuthController.authAdmin,
  (req, res) => {
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      res.status(400).send('Failed to find user from session');
    }

    try {
      const memoriesIndex = getMemoriesIndex();

      let years = memoriesIndex.years.map(year => {
        const files = year.files.filter(file => UserSourceDAO.hasAccess(user.id, file.sourceId));
        return {
          year: year.year,
          count: files.length,
          files: files.slice(0, 4).map(file => SourceService.getFile(file.sourceId, file.id)),
        };
      });

      years = years.filter(year => year.count > 0);

      res.send({
        years,
      });
    } catch (error) {
      res.sendStatus(400);
    }
  }
);

module.exports = router;
