const { getCollections } = require('../../config/db');

// Get homepage stats (total users, classes, enrollments)
exports.getHomepageStats = async (req, res) => {
    
    const { usersCollection, classesCollection, enrollmentsCollection } = getCollections();
    try {
        const totalUsers = await usersCollection.countDocuments();
        const totalClasses = await classesCollection.countDocuments({ status: 'approved' });
        
        
        const totalEnrollments = await enrollmentsCollection.countDocuments();

        res.send({
            totalUsers,
            totalClasses,
            totalEnrollments
        });
    } catch (error) {
        console.error("Failed to fetch homepage stats:", error);
        res.status(500).send({ message: "Failed to fetch homepage stats" });
    }
};

// Get all feedback for homepage
exports.getAllFeedback = async (req, res) => {
    const { feedbackCollection } = getCollections();
    try {
        const feedback = await feedbackCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.send(feedback);
    } catch (error) {
        console.error("Failed to fetch feedback:", error);
        res.status(500).send({ message: "Failed to fetch feedback" });
    }
};