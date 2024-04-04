const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');
const nodemailer = require('nodemailer');

router.use(cors());
router.use(express.json());

router.get('/get-agent-history/:agent_id', async (req, res) => {
  try {
    const [results] = req.query.date ?
    await connection.execute('SELECT * FROM kap_track WHERE agent_id = ? AND date = ? AND is_active = 1', [req.params.agent_id, req.query.date]) :
    await connection.execute('SELECT * FROM kap_track WHERE agent_id = ? AND is_active = 1', [req.params.agent_id]);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/add-agent-history', async (req, res) => {
  try {
    let agent = req.body;

    let totalSeconds = agent.active_time;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    agent.active_time = formattedTime;

    const [result] = await connection.execute(
                        'SELECT * FROM kap_track WHERE agent_id = ? AND website_url = ? AND date = ? AND is_active = 1', 
                        [agent.agent_id, agent.website_url, agent.date]
                      );
    if (result.length > 0) {
      await connection.execute(
        'UPDATE kap_track SET active_time = ? WHERE agent_id = ? AND website_url = ? AND date = ? AND is_active = 1', 
        [agent.active_time, agent.agent_id, agent.website_url, agent.date]
      );
    }
    else {
      await connection.execute(
        'INSERT INTO kap_track (active_time, agent_id, agent_name, website_url, date) VALUES (?, ?, ?, ?, ?)', 
        [agent.active_time, agent.agent_id, agent.agent_name, agent.website_url, agent.date]
      );
    }

    res.status(200).json({ Success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/agent-login', async (req, res) => {
  try {
    let agent = req.body;

    const [result] = await connection.execute(
                        'SELECT * FROM agents WHERE agent_id = ?', 
                        [agent.agent_id]
                      );
    if (result.length > 0) {
      res.status(200).json({ message: 'Already LoggedIn' });
    }
    else {
      await connection.execute(
        'INSERT INTO agents (agent_id, agent_name) VALUES (?, ?)', 
        [agent.agent_id, agent.agent_name]
      );
      res.status(200).json({ message: 'Login is successful' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/send-email-alert', async (req, res) => {
  let payload = req.body;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'satvik.km@kapturecrm.com',
      pass: 'Neenu@3333'
    }
  });

  const mailOptions = {
    from: 'satvik.km@kapturecrm.com',
    to: payload.toUser,
    subject: 'Agent Web Activity Alert',
    text: payload.emailBody
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      res.status(500).json({ message: 'Error while sending the email' });
    } else {
      res.status(200).json({ message: 'Email Sent Successfully' });
    }
  });
});

module.exports = router;
