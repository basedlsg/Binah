import { GoogleGenerativeAI } from "@google/generative-ai";
export class GeminiPlanner {
    constructor(apiKey, modelName = "gemini-1.5-flash") {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }
    async planActivities(params) {
        const { query, city, date, startTime } = params;
        const userPrompt = `You are a day planner. Convert this request into 1 activity.

City: ${city.name}
Date: ${date} 
Start Time: ${startTime}
Known Areas: ${city.knownAreas.join(", ")}
User Request: ${query}

Respond with ONLY valid JSON in this exact format:
{
  "activities": [
    {"description": "dinner", "area": "Chelsea", "time": "19:00", "category": "restaurant"}
  ]
}

Generate exactly ONE activity that matches the user's request.`;
        try {
            const model = this.client.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 500
                }
            });
            const result = await model.generateContent(userPrompt);
            const text = result.response.text().trim();
            // Extract JSON from response
            let jsonString = text;
            const jsonStart = text.indexOf("{");
            const jsonEnd = text.lastIndexOf("}") + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonString = text.slice(jsonStart, jsonEnd);
            }
            const parsed = JSON.parse(jsonString);
            const activities = Array.isArray(parsed?.activities) ? parsed.activities : [];
            // Ensure we have exactly 1 activity
            if (activities.length === 0) {
                return [{ description: query, area: city.defaultArea, time: startTime, category: "activity" }];
            }
            return activities.slice(0, 1);
        }
        catch (err) {
            console.error("Gemini error:", err);
            // Fallback: create 1 activity based on query
            return [{ description: query, area: city.defaultArea, time: startTime, category: "activity" }];
        }
    }
}
function addTime(timeStr, minutesToAdd) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}
