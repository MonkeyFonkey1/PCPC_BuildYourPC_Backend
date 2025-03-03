import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper to clean GPT response (removes ```json and ``` blocks)
function cleanGPTResponse(response: string): string {
    return response.replace(/```json|```/g, '').trim();
}

// Helper to normalize model names (trim to avoid inconsistencies)
function normalizeModelName(modelName: string): string {
    return modelName.trim();
}

function safeParseJSON(jsonString: string): any {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn("⚠️ GPT returned malformed JSON. Attempting auto-fix...");

        const fixedString = jsonString
            .replace(/,\s*([\]}])/g, '$1') 
            .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":'); 

        try {
            return JSON.parse(fixedString);
        } catch (finalError) {
            console.error("❌ Failed to auto-fix JSON from GPT.");
            throw finalError;  
        }
    }
}


// Helper to clean price (replace non-numeric values with 0)
function cleanPrice(price: any): number {
    if (typeof price === 'string' && price.toLowerCase().includes('check')) {
        console.warn(`⚠️ GPT returned non-numeric price "${price}". Replacing with 0.`);
        return 0;
    }
    return Number(price) || 0;
}

// Fetch recommended components list from GPT (with example response)
export async function getRecommendedParts(budget: number, preferences: string): Promise<any> {
    const prompt = `
        I am building a PC with a budget of ${budget} EUR. My preferences are: ${preferences}.
        Please recommend a compatible list of components (CPU, Motherboard, RAM, GPU, Storage, PSU, Case, CPU Cooler, Case Fans).
        Just list the component types and their recommended model names, no extra explanation.
        Example response:
        {
            "CPU": "Intel Core i7-13700K",
            "Motherboard": "ASUS ROG Strix Z790-F",
            "RAM": "Corsair Vengeance DDR5 32GB",
            "GPU": "NVIDIA GeForce RTX 4070",
            "Storage": "Samsung 980 Pro 1TB",
            "PSU": "Corsair RM850x",
            "Case": "NZXT H510",
            "CPU Cooler": "Noctua NH-D15",
            "Case Fan": "Corsair LL120 RGB"
        }
    `;

    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a PC building assistant.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 500
    });

    const parts = JSON.parse(response.choices[0]?.message.content || '{}');

    for (const key in parts) {
        parts[key] = normalizeModelName(parts[key]);
    }

    return parts;
}

// Fetch full component details from GPT (with example response)
export async function getComponentDetails(componentType: string, modelName: string): Promise<any> {
    const prompt = `
        Please provide full technical details for the following ${componentType}: ${modelName}.
        The response must be in valid JSON format with:
        - Properly quoted keys (like "type", "brand").
        - No trailing commas.
        - No comments or extra text.
        - No markdown formatting like \`\`\`json.
        Format the response as JSON with keys: type, brand, modelName, price, specs (detailed object with all important attributes like socket, wattage, memoryType, length, etc.).
        Example response for CPU:
        {
            "type": "CPU",
            "brand": "Intel",
            "modelName": "Intel Core i7-13700K",
            "socket": "LGA1700",
            "price": 400,
            "specs": {
                "cores": 16,
                "threads": 24,
                "baseClock": "3.4GHz",
                "boostClock": "5.3GHz",
                "powerDraw": 125
            }
        }
    `;

    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a PC building assistant.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 600
    });

    const rawContent = response.choices[0]?.message.content || '{}';
    const cleanedContent = cleanGPTResponse(rawContent);

     // Optional log before parsing (helps track future problems)
     if (/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g.test(cleanedContent)) {
        console.warn("⚠️ Possible unquoted keys detected in GPT response.");
    }
    if (/,\s*([\]}])/g.test(cleanedContent)) {
        console.warn("⚠️ Possible trailing commas detected in GPT response.");
    }
    
    const componentDetails = safeParseJSON(cleanedContent);
    componentDetails.modelName = normalizeModelName(componentDetails.modelName);
    componentDetails.price = cleanPrice(componentDetails.price);

    return componentDetails;
}

// Fetch replacement component if incompatibility is found
export async function getReplacementComponent(componentType: string, currentComponent: string, issue: string): Promise<string> {
    const prompt = `
        The component "${currentComponent}" (${componentType}) caused the following compatibility issue: "${issue}".
        Please suggest a compatible replacement ${componentType} that resolves this issue.
        Respond with only the model name, nothing else.
        Example response:
        "NZXT H710i"
    `;

    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a PC building assistant.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 100
    });

    return response.choices[0]?.message.content?.trim() || "";
}
