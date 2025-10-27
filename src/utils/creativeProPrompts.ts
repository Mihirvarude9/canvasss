export interface CreativeProPrompt {
  id: string;
  name: string;
  description: string;
  variations: {
    id: string;
    name: string;
    prompt: string;
  }[];
  model: 'gemini';
}

export const CREATIVE_PRO_PROMPTS: CreativeProPrompt[] = [
  {
    id: 'marketing',
    name: 'Marketing Purpose',
    description: 'Professional marketing images for advertising campaigns',
    model: 'gemini',
    variations: [
      {
        id: 'marketing-1',
        name: 'Clean Minimalist',
        prompt: 'Create a clean, minimalist marketing image featuring the product. White background, professional studio lighting, focus on product details and quality. Perfect for e-commerce and product catalogs.'
      },
      {
        id: 'marketing-2', 
        name: 'Lifestyle Integration',
        prompt: 'Create a lifestyle marketing image showing the product in a modern home setting. Natural lighting, contemporary interior design, showing how the product fits into daily life.'
      },
      {
        id: 'marketing-3',
        name: 'Professional Studio',
        prompt: 'Create a professional studio marketing image with dramatic lighting, high-end photography style, premium feel. Focus on luxury and quality appeal.'
      },
      {
        id: 'marketing-4',
        name: 'Social Media Ready',
        prompt: 'Create a social media optimized marketing image with vibrant colors, modern design, Instagram-ready aesthetic. Perfect for social media advertising campaigns.'
      },
      {
        id: 'marketing-5',
        name: 'Corporate Professional',
        prompt: 'Create a corporate professional marketing image with business setting, formal presentation, executive appeal. Perfect for B2B marketing and professional services.'
      }
    ]
  },
  {
    id: 'festive',
    name: 'Festive Purpose',
    description: 'Celebratory and festive themed product images',
    model: 'gemini',
    variations: [
      {
        id: 'festive-1',
        name: 'Christmas Holiday',
        prompt: 'Create a Christmas holiday festive image featuring the product. Red and green decorations, Christmas tree, warm lighting, holiday atmosphere, gift-wrapped presentation.'
      },
      {
        id: 'festive-2',
        name: 'New Year Celebration',
        prompt: 'Create a New Year celebration festive image with gold and silver decorations, party atmosphere, champagne, confetti, celebratory mood.'
      },
      {
        id: 'festive-3',
        name: 'Halloween Theme',
        prompt: 'Create a Halloween festive image with orange and black decorations, spooky atmosphere, pumpkins, Halloween-themed presentation.'
      },
      {
        id: 'festive-4',
        name: 'Valentine\'s Day',
        prompt: 'Create a Valentine\'s Day festive image with pink and red hearts, romantic atmosphere, love-themed decorations, romantic lighting.'
      },
      {
        id: 'festive-5',
        name: 'Birthday Party',
        prompt: 'Create a birthday party festive image with colorful balloons, party decorations, cake, celebration atmosphere, joyful and fun mood.'
      }
    ]
  },
  {
    id: 'billboard',
    name: 'Billboard',
    description: 'Large format billboard advertisement designs',
    model: 'gemini',
    variations: [
      {
        id: 'billboard-1',
        name: 'Urban Billboard',
        prompt: 'Create an urban billboard advertisement with city background, bold typography, high contrast, designed for busy urban environments and street advertising.'
      },
      {
        id: 'billboard-2',
        name: 'Highway Billboard',
        prompt: 'Create a highway billboard advertisement with open road background, large text space, high visibility, designed for fast-moving traffic viewing.'
      },
      {
        id: 'billboard-3',
        name: 'Digital Billboard',
        prompt: 'Create a digital billboard advertisement with modern design, LED-style lighting, contemporary graphics, perfect for digital advertising displays.'
      },
      {
        id: 'billboard-4',
        name: 'Shopping Mall Billboard',
        prompt: 'Create a shopping mall billboard advertisement with retail environment, consumer-focused design, shopping atmosphere, retail appeal.'
      },
      {
        id: 'billboard-5',
        name: 'Airport Billboard',
        prompt: 'Create an airport billboard advertisement with travel theme, international appeal, professional design, perfect for airport advertising.'
      }
    ]
  },
  {
    id: 'model',
    name: 'Model Using Product',
    description: 'Lifestyle images with models using the product',
    model: 'gemini',
    variations: [
      {
        id: 'model-1',
        name: 'Professional Model',
        prompt: 'Create a lifestyle image with a professional business model using the product. Corporate setting, professional attire, business environment, executive appeal.'
      },
      {
        id: 'model-2',
        name: 'Casual Lifestyle',
        prompt: 'Create a casual lifestyle image with a relaxed model using the product. Casual clothing, home setting, natural and authentic interaction.'
      },
      {
        id: 'model-3',
        name: 'Fashion Model',
        prompt: 'Create a fashion-focused lifestyle image with a stylish model using the product. Fashion-forward styling, trendy setting, contemporary appeal.'
      },
      {
        id: 'model-4',
        name: 'Family Model',
        prompt: 'Create a family lifestyle image with family members using the product. Family setting, warm atmosphere, multi-generational appeal.'
      },
      {
        id: 'model-5',
        name: 'Athletic Model',
        prompt: 'Create an athletic lifestyle image with a fitness model using the product. Sports setting, active lifestyle, health and fitness appeal.'
      }
    ]
  },
  {
    id: 'creative',
    name: 'Creative Product Shoot',
    description: 'Artistic and creative product photography',
    model: 'gemini',
    variations: [
      {
        id: 'creative-1',
        name: 'Abstract Art',
        prompt: 'Create an abstract artistic product shoot with unique angles, creative lighting, artistic composition, and innovative presentation. Focus on artistic expression.'
      },
      {
        id: 'creative-2',
        name: 'Macro Photography',
        prompt: 'Create a macro photography creative shoot with extreme close-ups, detailed textures, artistic lighting, and creative depth of field.'
      },
      {
        id: 'creative-3',
        name: 'Surreal Art',
        prompt: 'Create a surreal artistic product shoot with dreamlike elements, creative manipulation, artistic vision, and imaginative presentation.'
      },
      {
        id: 'creative-4',
        name: 'Minimalist Art',
        prompt: 'Create a minimalist artistic product shoot with clean lines, simple composition, artistic restraint, and elegant presentation.'
      },
      {
        id: 'creative-5',
        name: 'Conceptual Art',
        prompt: 'Create a conceptual artistic product shoot with symbolic elements, creative storytelling, artistic metaphor, and conceptual presentation.'
      }
    ]
  }
];

export const getCreativeProPrompt = (id: string): CreativeProPrompt | undefined => {
  return CREATIVE_PRO_PROMPTS.find(prompt => prompt.id === id);
};

export const getAllCreativeProPrompts = (): CreativeProPrompt[] => {
  return CREATIVE_PRO_PROMPTS;
};
