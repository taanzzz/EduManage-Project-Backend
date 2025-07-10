const { getCollections } = require('../../config/db');

// Get homepage stats (total users, classes, enrollments)
exports.getHomepageStats = async (req, res) => {
    const { usersCollection, classesCollection } = getCollections();
    try {
        const totalUsers = await usersCollection.countDocuments();
        const totalClasses = await classesCollection.countDocuments({ status: 'approved' });

        // To get total enrollments, we sum up the totalEnrollment field from all classes
        const enrollmentPipeline = [
            { $group: { _id: null, total: { $sum: "$totalEnrollment" } } }
        ];
        const enrollmentResult = await classesCollection.aggregate(enrollmentPipeline).toArray();
        const totalEnrollments = enrollmentResult.length > 0 ? enrollmentResult[0].total : 0;

        res.send({
            totalUsers,
            totalClasses,
            totalEnrollments
        });
    } catch (error) {
        
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
        
        res.status(500).send({ message: "Failed to fetch feedback" });
    }
};