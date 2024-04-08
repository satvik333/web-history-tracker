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

router.get('/get-all-agents', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM agents');
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-all-history', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM kap_track');
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

router.get('/send-email-alert', async (req, res) => {
  const currentTime = new Date(); 
  const oneHourAgo = new Date(currentTime.getTime() - (1 * 60 * 60 * 1000));
  const currentDate = currentTime.toISOString().split('T')[0];

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'satvik.km@kapturecrm.com',
      pass: 'Neenu@3333'
    }
  });

  const [agents] = await connection.execute('SELECT * FROM agents');

  for (const agent of agents) {
      try {
          const [rows] = await connection.execute('SELECT website_url FROM kap_track WHERE agent_id = ? AND recorded_time > ? AND date = ? AND website_url NOT LIKE \'%kapturecrm%\'', [agent.agent_id, oneHourAgo, currentDate]);
          if (rows.length > 0) {
              const webUrls = rows.map(row => row.website_url).join('\n');
              
              const mailOptions = {
                  from: 'satvik.km@kapturecrm.com',
                  to: 'satvik.km@kapturecrm.com', 
                  subject: 'Agent Web Activity Alert',
                  text: `${agent.agent_name} has spent more than 10 minutes on:\n${webUrls}`
              };
      
              transporter.sendMail(mailOptions, function(error, info) {
                  if (error) {
                      console.error('Error while sending the email:', error);
                  } else {
                      console.log('Email Sent Successfully');
                  }
              });
          }
      } catch (error) {
          console.error('Error executing query:', error);
      }
  }
  res.status(200).json({ message: 'Successfully sent email' });
});

module.exports = router;
