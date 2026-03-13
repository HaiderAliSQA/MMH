const express = require('express');
const router = express.Router();

const USERS_MAP = {
  receptionist: { pass:"1234", role:"receptionist", name:"Zara Shahid",  avClass:"av-rec" },
  doctor:       { pass:"1234", role:"doctor",       name:"Dr. Hamid Raza",avClass:"av-doc" },
  lab:          { pass:"1234", role:"lab",          name:"Asad Lab Tech", avClass:"av-lab" },
  pharmacist:   { pass:"1234", role:"pharmacist",   name:"Nida Pharmacist",avClass:"av-pha" },
  admin:        { pass:"1234", role:"admin",        name:"Admin MMH",     avClass:"av-adm" },
  manager:      { pass:"1234", role:"manager",      name:"Manager Sb.",   avClass:"av-mgr" },
  patient:      { pass:"1234", role:"patient",      name:"Muhammad Ali",  avClass:"av-pat" },
};

router.post('/login', (req, res) => {
    const { role, pass } = req.body;
    const user = USERS_MAP[role];
    if (user && user.pass === pass) {
        // In a real app, generate a real JWT here
        res.json({
            user: { name: user.name, role: user.role },
            token: 'mock-jwt-token-for-demo'
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = router;
