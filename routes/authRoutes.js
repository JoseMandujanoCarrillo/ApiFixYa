router.get('/', authenticate, authorizeRole('user'), async (req, res) => {
    try {
      const proposals = await Proposal.findAll({ where: { userId: req.user.id } });
      res.json(proposals);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  router.get('/for-cleaner', authenticate, authorizeRole('cleaner'), async (req, res) => {
    try {
      const proposals = await Proposal.findAll({ where: { cleanerId: req.user.id } });
      res.json(proposals);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  