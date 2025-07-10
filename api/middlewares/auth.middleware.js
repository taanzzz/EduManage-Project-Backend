const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        
        return res.status(401).send({ message: "Unauthorized access" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            
            return res.status(403).send({ message: "Forbidden access" });
        }
        
        req.decoded = decoded;
        next();
    });
};
const verifyAdmin = (req, res, next) => {
    
    if (req.decoded?.role !== 'admin') {
        
        return res.status(403).send({ message: 'Forbidden access: Admin role required' });
    }
    
    next();
};

const verifyTeacher = (req, res, next) => {
    
    if (req.decoded?.role !== 'teacher') {
        
        return res.status(403).send({ message: 'Forbidden access: Teacher role required' });
    }
    
    next();
};

module.exports = { verifyToken, verifyAdmin, verifyTeacher };