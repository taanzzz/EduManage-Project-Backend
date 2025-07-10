const { getCollections, getObjectId } = require('../../config/db');

// Get all users with search and pagination (Admin only)
exports.getAllUsers = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    const { usersCollection } = getCollections();
    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    
    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const users = await usersCollection.find(query).skip(skip).limit(parseInt(limit)).toArray();
        const total = await usersCollection.countDocuments(query);
        res.send({ users, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch users" });
    }
};

// Make a user an admin (Admin only)
exports.makeAdmin = async (req, res) => {
    const { id } = req.params;
    const { usersCollection } = getCollections();
    try {
        const result = await usersCollection.updateOne(
            { _id: getObjectId(id) }, 
            { $set: { role: 'admin' } }
        );
        if (result.modifiedCount === 0) {
            return res.status(404).send({ message: 'User not found or already an admin.' });
        }
        res.send({ message: 'User role updated to admin successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update user role' });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    const { email } = req.params;
    const { usersCollection } = getCollections();
    try {
        const user = await usersCollection.findOne({ email });
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch user profile" });
    }
};



exports.updateUserProfile = async (req, res) => {
    const { email } = req.params;
    const updatedData = req.body; 

    
    if (req.decoded.email !== email) {
        return res.status(403).send({ message: 'Forbidden access.' });
    }

    const { usersCollection } = getCollections();
    try {
        const result = await usersCollection.updateOne(
            { email: email },
            { $set: updatedData }
        );
        res.send(result);
    } catch (error) {
        
        res.status(500).send({ message: "Failed to update profile" });
    }
};