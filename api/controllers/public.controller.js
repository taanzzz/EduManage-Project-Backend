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

exports.getPopularClasses = async (req, res) => {
    try {
        const { classesCollection } = getCollections();
        const popularClasses = await classesCollection
            .find({ status: 'approved' }) 
            .sort({ totalEnrollment: -1 }) 
            .limit(6) 
            .toArray();
        
        res.send(popularClasses);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch popular classes." });
    }
};

exports.getActiveBanners = async (req, res) => {
    try {
        const { bannersCollection } = getCollections();
        const banners = await bannersCollection.find({ isActive: true }).toArray();
        res.send(banners);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch banners." });
    }
};

exports.getFeaturedTeachers = async (req, res) => {
    try {
        const { classesCollection } = getCollections();
        const featuredTeachers = await classesCollection.aggregate([
            { $match: { status: 'approved' } },
            { 
                $group: {
                    _id: "$teacher.email",
                    name: { $first: "$teacher.name" },
                    totalEnrollment: { $sum: "$totalEnrollment" }
                } 
            },
            { $sort: { totalEnrollment: -1 } },
            { $limit: 6 },
            
            {
                $lookup: {
                    from: "users",
                    localField: "_id", 
                    foreignField: "email",
                    as: "teacherDetails"
                }
            },
            {
                $unwind: "$teacherDetails"
            },
            {
                $project: {
                    _id: "$teacherDetails._id",
                    name: "$teacherDetails.name",
                    email: "$teacherDetails.email",
                    image: "$teacherDetails.image",
                    totalEnrollment: "$totalEnrollment"
                }
            }
        ]).toArray();
        
        res.send(featuredTeachers);
    } catch (error) {
        console.error("Failed to fetch featured teachers:", error);
        res.status(500).send({ message: "Failed to fetch featured teachers." });
    }
};