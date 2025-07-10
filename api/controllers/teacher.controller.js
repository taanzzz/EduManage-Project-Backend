const { getCollections, getObjectId } = require('../../config/db');


exports.applyForTeaching = async (req, res) => {
    const application = { ...req.body, status: 'pending', createdAt: new Date() };
    const { teacherRequestsCollection, usersCollection } = getCollections();

    try {
        
        const existingRequest = await teacherRequestsCollection.findOne({ email: application.email });
        if (existingRequest) {
            return res.status(409).send({ message: "You have already submitted an application." }); 
        }
        
        const user = await usersCollection.findOne({ email: application.email });
        if (user?.role === 'teacher') {
             return res.status(400).send({ message: "You are already a teacher." });
        }
        

        const result = await teacherRequestsCollection.insertOne(application);
        res.status(201).send(result);

    } catch (error) {
        res.status(500).send({ message: "Failed to submit application" });
    }
};


exports.getTeacherRequests = async (req, res) => {
    const { teacherRequestsCollection } = getCollections();
    try {
        
        const requests = await teacherRequestsCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.send(requests);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch teacher requests" });
    }
};


exports.handleTeacherRequest = async (req, res) => {
    const { id: requestId } = req.params;
    const { status } = req.body; 

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).send({ message: 'Invalid status.' });
    }

    const { teacherRequestsCollection, usersCollection } = getCollections();
    try {
        const request = await teacherRequestsCollection.findOne({ _id: getObjectId(requestId) }); 
        if (!request) {
            return res.status(404).send({ message: 'Request not found.' });
        }

        // স্ট্যাটাস আপডেট
        await teacherRequestsCollection.updateOne(
            { _id: getObjectId(requestId) }, 
            { $set: { status: status } }
        );

        
        if (status === 'approved') {
            await usersCollection.updateOne(
                { email: request.email },
                { $set: { role: 'teacher' } }
            );
        }
        res.send({ message: `Request has been ${status}.` });

    } catch (error) {
        res.status(500).send({ message: "Failed to handle request" });
    }
};