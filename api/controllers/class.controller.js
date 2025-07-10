const { getCollections, getObjectId } = require('../../config/db');

// Add a new class (Teacher only)
exports.addClass = async (req, res) => {
    const classData = { ...req.body, status: 'pending', totalEnrollment: 0, createdAt: new Date() };
    const { classesCollection } = getCollections();
    try {
        const result = await classesCollection.insertOne(classData);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to add class" });
    }
};


exports.getApprovedClasses = async (req, res) => {
    
    const { page = 1, limit = 6, search = '' } = req.query;

    const query = {
        status: 'approved',
        
        title: { $regex: search, $options: 'i' }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { classesCollection } = getCollections();

    try {
        const classes = await classesCollection.find(query).skip(skip).limit(parseInt(limit)).toArray();
        const total = await classesCollection.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        
        res.send({ classes, totalPages });
    } catch (error) {
        
        res.status(500).send({ message: "Failed to fetch classes" });
    }
};

// Get all classes for Admin Dashboard
exports.getAllClassesForAdmin = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { classesCollection } = getCollections();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    try {
        
        const classes = await classesCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray();
        const total = await classesCollection.countDocuments({});
        res.send({ classes, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch all classes" });
    }
};

// Get classes created by a specific teacher
exports.getMyClasses = async (req, res) => {
    const { email } = req.params;
    const { classesCollection } = getCollections();
    if(req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access."});
    }
    try {
        const classes = await classesCollection.find({ 'teacher.email': email }).toArray();
        res.send(classes);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch your classes" });
    }
};

// Update a class (Teacher only)
exports.updateClass = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const { classesCollection } = getCollections();
    try {
        const result = await classesCollection.updateOne({ _id: getObjectId(id) }, { $set: updatedData });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: 'Failed to update class' });
    }
};

// Delete a class (Teacher only)
exports.deleteClass = async (req, res) => {
    const { id } = req.params;
    const { classesCollection } = getCollections();
    try {
        const result = await classesCollection.deleteOne({ _id: getObjectId(id) });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete class' });
    }
};

// Handle class status (Approve/Reject) by Admin
exports.handleClassStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).send({ message: 'Invalid status.' });
    }

    const { classesCollection } = getCollections();

    try {
        

        const objectId = getObjectId(id); 

        const result = await classesCollection.updateOne(
            { _id: objectId },
            { $set: { status } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send({ message: "Class not found or status unchanged." });
        }

        res.send({ message: `Class has been ${status}.` });
    } catch (error) {
        
        res.status(500).send({ message: 'Failed to update class status' });
    }
};



// Get a single class details
exports.getClassById = async (req, res) => {
    const { id } = req.params;
    const { classesCollection } = getCollections();
    try {
        const objectId = getObjectId(id); 
        const classData = await classesCollection.findOne({ _id: objectId });

        if (!classData) {
            return res.status(404).send({ message: "Class not found" });
        }

        res.send(classData);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch class details" });
    }
};
