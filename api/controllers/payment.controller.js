const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getCollections, getObjectId } = require('../../config/db');

exports.createPaymentIntent = async (req, res) => {
    console.log('\n--- [DEBUG] 2. createPaymentIntent controller entered ---');
    
    const { classId } = req.body;
    console.log('[DEBUG] Received classId:', classId);

    if (!classId) {
        console.error('❌ [DEBUG] Error: Class ID is missing in the request body.');
        return res.status(400).send({ message: "Class ID is required." });
    }

    try {
        const { classesCollection } = getCollections();
        console.log('[DEBUG] Searching for class in database...');
        const classToEnroll = await classesCollection.findOne({ _id: getObjectId(classId) });

        if (!classToEnroll) {
            console.error(`❌ [DEBUG] Error: Class with ID ${classId} not found in DB.`);
            return res.status(404).send({ message: "Class not found." });
        }
        console.log('✅ [DEBUG] Class found:', classToEnroll.title);

        const amount = Math.round(classToEnroll.price * 100);
        console.log(`[DEBUG] Calculated amount for Stripe: ${amount} cents`);

        if (amount < 50) {
            console.error('❌ [DEBUG] Error: Amount is too low for Stripe.');
            return res.status(400).send({ message: "Amount too low." });
        }

        console.log('[DEBUG] Creating Stripe Payment Intent...');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card']
        });
        
        console.log('✅ [DEBUG] Stripe Payment Intent created successfully.');
        res.send({
            clientSecret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error("❌ [DEBUG] FATAL ERROR in createPaymentIntent:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    const { email } = req.params;
    if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access." });
    }
    const { paymentsCollection } = getCollections();
    try {
        const orders = await paymentsCollection.aggregate([
            { $match: { userEmail: email } },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: '_id',
                    as: 'classDetails'
                }
            },
            { $unwind: '$classDetails' },
            { $sort: { createdAt: -1 } }
        ]).toArray();
        res.send(orders);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch order history." });
    }
};