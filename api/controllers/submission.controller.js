const { getCollections, getObjectId } = require('../../config/db');

exports.submitAssignment = async (req, res) => {
    const submissionData = { ...req.body, submittedAt: new Date() };
    const { submissionsCollection, assignmentsCollection } = getCollections();
    
    // Ensure IDs are converted to ObjectId
    submissionData.classId = getObjectId(submissionData.classId);
    submissionData.assignmentId = getObjectId(submissionData.assignmentId);

    try {
        
        const result = await submissionsCollection.insertOne(submissionData);

        
        await assignmentsCollection.updateOne(
            { _id: submissionData.assignmentId },
            { $inc: { totalSubmissions: 1 } }
        );

        res.status(201).send(result);
    } catch (error) {
        
        res.status(500).send({ message: "Failed to submit assignment" });
    }
};

exports.getSubmissionsForClass = async (req, res) => {
    const { classId } = req.params;
    try {
        const { submissionsCollection } = getCollections();
        
        const submissions = await submissionsCollection.find({ classId: getObjectId(classId) }).toArray();
        res.send(submissions);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch submissions." });
    }
};