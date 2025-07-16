const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getCollections } = require('../../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChatMessage = async (req, res) => {
    const { message, history = [] } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let processedHistory = history;
        if (processedHistory.length > 0 && processedHistory[0].role === 'model') {
            processedHistory = processedHistory.slice(1);
        }

        
        const { classesCollection, usersCollection, assignmentsCollection } = getCollections();
        
        
        const teachers = await usersCollection.find({ role: 'teacher' }).project({ name: 1, email: 1 }).toArray();
        const teacherInfo = teachers.map(t => `- ${t.name} (${t.email})`).join('\n');
        
        
        const approvedClasses = await classesCollection.find({ status: 'approved' }).project({ title: 1, price: 1, 'teacher.name': 1 }).toArray();
        const classInfo = approvedClasses.map(c => `- Course: ${c.title}, Instructor: ${c.teacher.name}, Price: $${c.price}`).join('\n');

        
        const allAssignments = await assignmentsCollection.find({}).project({ title: 1, deadline: 1 }).toArray();
        const assignmentInfo = allAssignments.map(a => `- Assignment: ${a.title}, Deadline: ${new Date(a.deadline).toLocaleDateString()}`).join('\n');

        const totalUsers = await usersCollection.countDocuments();

        
        const systemPrompt = `
            You are "EduManage Helper", a friendly AI assistant for the EduManage e-learning platform.
            Your goal is to answer user questions based ONLY on the information provided below. Be concise, friendly, and helpful.
            If the user's question cannot be answered, politely say "I'm sorry, I don't have that information. You can explore our courses for more details."

            --- Available Information ---
            Total Users: ${totalUsers}
            Instructors:
            ${teacherInfo}
            
            Available Courses:
            ${classInfo}

            Upcoming Assignment Deadlines:
            ${assignmentInfo}
            --- End of Information ---
        `;
        
        const chat = model.startChat({
            history: processedHistory,
            generationConfig: { maxOutputTokens: 250 },
            systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();
        
        res.send({ response: text });

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        res.status(500).send({ message: "Failed to get response from AI." });
    }
};