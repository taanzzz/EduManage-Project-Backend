const { getCollections, getObjectId } = require('../../config/db');

exports.submitFeedback = async (req, res) => {
    
    const { classId, rating, reviewText, userEmail, userName, userImage, classTitle } = req.body;

    if (!classId || !rating || !reviewText || !userEmail) {
        return res.status(400).send({ message: "Missing required feedback information." });
    }

    const { feedbackCollection, usersCollection } = getCollections();
    try {
        const existingFeedback = await feedbackCollection.findOne({ userEmail, classId: getObjectId(classId) });
        if (existingFeedback) {
            return res.status(409).send({ message: "You have already submitted feedback for this class." });
        }

        
        let finalStudentInfo = {};
        const studentInDB = await usersCollection.findOne({ email: userEmail });

        if (studentInDB) {
            
            finalStudentInfo = {
                name: studentInDB.name,
                email: studentInDB.email,
                image: studentInDB.image
            };
        } else {
            
            finalStudentInfo = {
                name: userName,
                email: userEmail,
                image: userImage
            };
        }

        const feedbackData = {
            classId: getObjectId(classId),
            classTitle: classTitle,
            rating: parseFloat(rating),
            reviewText,
            studentInfo: finalStudentInfo, 
            createdAt: new Date()
        };

        const result = await feedbackCollection.insertOne(feedbackData);
        res.status(201).send(result);

    } catch (error) {
        res.status(500).send({ message: "Failed to submit feedback." });
    }
};

// getAllFeedback 
exports.getAllFeedback = async (req, res) => {
    const { feedbackCollection } = getCollections();
    try {
        const feedback = await feedbackCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.send(feedback);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch feedback." });
    }
};