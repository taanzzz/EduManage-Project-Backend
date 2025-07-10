const { getCollections, getObjectId } = require('../../config/db');

exports.confirmEnrollment = async (req, res) => {
    
    
    const { classId, transactionId, userEmail, price } = req.body;
    
    

    if (!classId || !transactionId || !userEmail || !price) {
        
        return res.status(400).send({ message: "Missing required enrollment information." });
    }

    const { paymentsCollection, enrollmentsCollection, classesCollection } = getCollections();

    try {
        await paymentsCollection.insertOne({ userEmail, classId: getObjectId(classId), transactionId, amount: price, status: 'succeeded', createdAt: new Date() });
        await enrollmentsCollection.insertOne({ userEmail, classId: getObjectId(classId), enrolledAt: new Date() });
        const updateResult = await classesCollection.updateOne({ _id: getObjectId(classId) }, { $inc: { totalEnrollment: 1 } });
        res.status(201).send({ message: "Enrollment successful and recorded." });
    } catch (error) {
        
        res.status(500).send({ message: "Failed to confirm enrollment." });
    }
};



exports.getMyEnrolledClasses = async (req, res) => {
    const { email } = req.params;

    if (req.decoded.email !== email) {
        return res.status(403).send({ message: 'Forbidden access.' });
    }

    const { enrollmentsCollection } = getCollections();
    try {
        
        const enrolledClasses = await enrollmentsCollection.aggregate([
            {
                $match: { userEmail: email }
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: '_id',
                    as: 'classDetails'
                }
            },
            {
                $unwind: '$classDetails'
            }
        ]).toArray();

        res.send(enrolledClasses);

    } catch (error) {
        res.status(500).send({ message: "Failed to fetch enrolled classes." });
    }
};