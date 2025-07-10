const { getCollections, getObjectId } = require('../../config/db');

exports.getAssignmentsForClass = async (req, res) => {
    const { classId } = req.params;
    try {
        const { assignmentsCollection } = getCollections();
        const assignments = await assignmentsCollection.find({ classId: getObjectId(classId) }).toArray();
        res.send(assignments);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch assignments." });
    }
};


exports.createAssignment = async (req, res) => {
    const assignmentData = { ...req.body, createdAt: new Date() };

    
    assignmentData.classId = getObjectId(assignmentData.classId);
    
    
    assignmentData.deadline = new Date(assignmentData.deadline);

    const { assignmentsCollection, classesCollection } = getCollections();
    try {
        
        const result = await assignmentsCollection.insertOne(assignmentData);

        
        await classesCollection.updateOne(
            { _id: assignmentData.classId },
            { $inc: { totalAssignment: 1 } }
        );

        res.status(201).send(result);
    } catch (error) {
        
        res.status(500).send({ message: "Failed to create assignment" });
    }
};