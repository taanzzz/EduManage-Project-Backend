const jwt = require('jsonwebtoken');
const { getCollections } = require('../../config/db');

exports.createTokenAndUser = async (req, res) => {
  const userInfo = req.body;
  const email = userInfo.email;
  const { usersCollection } = getCollections();
  try {
    let user = await usersCollection.findOne({ email });
    if (!user) {
      const newUser = {
        name: userInfo.name,
        email: email,
        image: userInfo.photoURL,
        role: 'student', // Default role is student
        createdAt: new Date()
      };
      await usersCollection.insertOne(newUser);
      user = newUser;
    }
    const token = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    res.send({ token, role: user.role });
  } catch (error) {
    
    res.status(500).send({ message: "Server error during authentication." });
  }
};