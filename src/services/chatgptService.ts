import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


function cleanGPTResponse(response: string): string {
    return response.replace(/```json|```/g, '').trim();
}


function normalizeModelName(modelName: string): string {
    return modelName.trim();
}

function cleanPrice(price: any): number {
    if (typeof price === 'string' && price.toLowerCase().includes('check')) {
        console.warn(`⚠️ GPT returned non-numeric price "${price}". Replacing with 0.`);
        return 0;
    }
    return Number(price) || 0; // Ensure price is always a number
}

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


export async function getComponentDetails(componentType: string, modelName: string): Promise<any> {
    const prompt = `
        Please provide full technical details for the following ${componentType}: ${modelName}.
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

    const componentDetails = JSON.parse(cleanedContent);

    componentDetails.modelName = normalizeModelName(componentDetails.modelName);
    componentDetails.price = cleanPrice(componentDetails.price);

    return componentDetails;
}
