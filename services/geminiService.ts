import { GoogleGenAI, Type } from "@google/genai";
import { Character, OSEClass, Item, Container, ItemCategory } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCharacterDetails = async (
  characterClass?: OSEClass, 
  level: number = 1
): Promise<Partial<Character>> => {
  const ai = getClient();
  
  const prompt = `Create an Old School Essentials (B/X D&D) character. 
  ${characterClass ? `Class: ${characterClass}.` : 'Choose a random class.'}
  Level: ${level}.
  
  Create name, abilities (3d6), HP, AC, and backstory.
  Create a detailed inventory with containers.
  IMPORTANT: For every item, add weight in "Coins" (cn, standard OSE), damage (if weapon, e.g. "1d6"), category (Weapon, Armor, etc.) and a short description. All output must be in ENGLISH.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          class: { type: Type.STRING },
          alignment: { type: Type.STRING },
          hp: { type: Type.INTEGER },
          maxHp: { type: Type.INTEGER },
          ac: { type: Type.INTEGER },
          abilities: {
            type: Type.OBJECT,
            properties: {
              STR: { type: Type.INTEGER },
              INT: { type: Type.INTEGER },
              WIS: { type: Type.INTEGER },
              DEX: { type: Type.INTEGER },
              CON: { type: Type.INTEGER },
              CHA: { type: Type.INTEGER },
            },
            required: ["STR", "INT", "WIS", "DEX", "CON", "CHA"]
          },
          savingThrows: {
             type: Type.OBJECT,
             properties: {
                death: { type: Type.INTEGER },
                wands: { type: Type.INTEGER },
                paralysis: { type: Type.INTEGER },
                breath: { type: Type.INTEGER },
                spells: { type: Type.INTEGER },
             },
             required: ["death", "wands", "paralysis", "breath", "spells"]
          },
          backstory: { type: Type.STRING },
          containers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the container (e.g. Backpack)" },
                items: {
                  type: Type.ARRAY,
                  items: {
                     type: Type.OBJECT,
                     properties: {
                        name: { type: Type.STRING },
                        count: { type: Type.INTEGER },
                        weight: { type: Type.INTEGER, description: "Weight in Coins (cn)" },
                        category: { type: Type.STRING, enum: Object.values(ItemCategory) },
                        damage: { type: Type.STRING, description: "Damage e.g. 1d6 (optional)" },
                        description: { type: Type.STRING, description: "Short description" },
                        isMagical: { type: Type.BOOLEAN },
                        isUnidentified: { type: Type.BOOLEAN },
                     },
                     required: ["name", "count", "weight"]
                  }
                }
              },
              required: ["name", "items"]
            }
          },
        },
        required: ["name", "class", "hp", "abilities", "backstory", "containers"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response received from Gemini.");
  }

  const rawData = JSON.parse(response.text);

  // Post-processing to add IDs to containers and items
  const containers: Container[] = rawData.containers?.map((c: any) => ({
    id: crypto.randomUUID(),
    name: c.name,
    items: c.items?.map((i: any) => ({
      id: crypto.randomUUID(),
      name: i.name,
      count: i.count || 1,
      weight: i.weight || 0,
      damage: i.damage || '',
      description: i.description || '',
      category: i.category || ItemCategory.General,
      isMagical: i.isMagical || false,
      isUnidentified: i.isUnidentified || false,
    })) || []
  })) || [];

  return {
    ...rawData,
    containers,
    id: crypto.randomUUID(),
    xp: 0,
    level: level
  } as Partial<Character>;
};

export const generateBackstoryOnly = async (char: Character): Promise<string> => {
  const ai = getClient();
  const prompt = `Write a dark, atmospheric OSE backstory for:
  Name: ${char.name}
  Class: ${char.class}
  Level: ${char.level}
  Alignment: ${char.alignment}
  Abilities: STR ${char.abilities.STR}, INT ${char.abilities.INT}, WIS ${char.abilities.WIS}.
  
  Max 100 words. In English.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Could not generate story.";
};