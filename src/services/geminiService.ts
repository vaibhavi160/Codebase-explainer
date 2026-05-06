import { GoogleGenAI, Type } from "@google/genai";
import { RepoStructure } from "./githubService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface CodebaseAnalysis {
  projectOverview: string;
  techStack: string[];
  mainFlow: string;
  keyFiles: { path: string; purpose: string }[];
  fileRelationships: { source: string; target: string; type: string }[];
  healthScore: number;
  healthFindings: { type: 'positive' | 'negative' | 'neutral'; message: string }[];
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    projectOverview: { type: Type.STRING, description: "Detailed overview of what the project does" },
    techStack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of technologies used" },
    mainFlow: { type: Type.STRING, description: "Explanation of the main data/user flow" },
    healthScore: { type: Type.NUMBER, description: "Score from 1-100 based on documentation, structure, and complexity" },
    healthFindings: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
          message: { type: Type.STRING }
        },
        required: ["type", "message"]
      }
    },
    keyFiles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING },
          purpose: { type: Type.STRING }
        },
        required: ["path", "purpose"]
      }
    },
    fileRelationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["source", "target", "type"]
      }
    }
  },
  required: ["projectOverview", "techStack", "mainFlow", "keyFiles", "fileRelationships", "healthScore", "healthFindings"]
};

export async function analyzeCodebase(repoData: RepoStructure): Promise<CodebaseAnalysis> {
  const prompt = `
    Analyze the following GitHub repository structure and metadata.
    
    Repository: ${repoData.owner}/${repoData.repo}
    Languages: ${JSON.stringify(repoData.languages)}
    Important Files:
    - README: ${repoData.readme?.slice(0, 2000)}
    - package.json dependencies: ${JSON.stringify(repoData.packageJson?.dependencies || {})}
    
    File Tree (Partial):
    ${repoData.tree.slice(0, 100).map(n => n.path).join("\n")}
    
    Tasks:
    1. Project overview.
    2. Full tech stack.
    3. Main execution flow.
    4. Key architectural files.
    5. Structural relationships.
    6. Calculate a "Repo Health Score" (1-100) based on perceived quality, structure, and documentation.
    7. Provide 3-5 specific health findings.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    }
  });

  return JSON.parse(response.text || '{}') as CodebaseAnalysis;
}

export async function analyzeFileDeepDive(
  repoData: RepoStructure,
  filePath: string,
  content: string,
  level: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
) {
  const prompt = `
    Explain the following file from the repository "${repoData.owner}/${repoData.repo}" 
    at an ${level} level.
    
    File: ${filePath}
    Content:
    ${content.slice(0, 5000)}
    
    Provide:
    1. A one-sentence summary.
    2. Breakdown of key functions/logic.
    3. Major inputs and outputs.
    4. Potential code smells or bugs.
    5. Suggested test cases for this file.
    
    Use markdown formatting.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text;
}

export async function generateDocumentation(repoData: RepoStructure, type: 'readme' | 'quickstart' | 'learning-path') {
  const prompt = `
    Generate a high-quality ${type} for the repository "${repoData.owner}/${repoData.repo}".
    
    Context:
    - Languages: ${JSON.stringify(repoData.languages)}
    - Dependencies: ${JSON.stringify(repoData.packageJson?.dependencies || {})}
    - README snippet: ${repoData.readme?.slice(0, 1000)}
    
    Format:
    - If readme: Professional README.md with overview, features, and setup.
    - If quickstart: Step-by-step guide to get it running locally.
    - If learning-path: A sequence of files/folders to read to understand the project (e.g. "Start here", "Then look at X").
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text;
}

export async function compareCodebases(repo1: RepoStructure, repo2: RepoStructure) {
  const prompt = `
    Compare these two GitHub repositories side-by-side:
    
    Repo A: ${repo1.owner}/${repo1.repo}
    Languages A: ${JSON.stringify(repo1.languages)}
    Tech Stack A: ${JSON.stringify(repo1.packageJson?.dependencies || {})}
    
    Repo B: ${repo2.owner}/${repo2.repo}
    Languages B: ${JSON.stringify(repo2.languages)}
    Tech Stack B: ${JSON.stringify(repo2.packageJson?.dependencies || {})}
    
    Provide a detailed comparison focusing on:
    1. Architectural differences.
    2. Which one is more scalable and why?
    3. Which one has better documentation/structure?
    4. Tech stack trade-offs.
    5. Final verdict on which repo is "better" for specific use cases.
    
    Format as Markdown with clear headings and a comparison table.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: prompt
  });
  return response.text;
}

export async function chatAboutCodebase(
  repoData: RepoStructure, 
  analysis: CodebaseAnalysis, 
  query: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const systemInstruction = `
    You are an expert software architect acting as a human mentor.
    You are explaining the repository "${repoData.owner}/${repoData.repo}" to a developer.
    
    Context:
    - Overview: ${analysis.projectOverview}
    - Tech Stack: ${analysis.techStack.join(", ")}
    - Main Flow: ${analysis.mainFlow}
    - Key Files: ${analysis.keyFiles.map(f => f.path).join(", ")}
    
    Use the provided context to answer questions accurately and deeply. If you need more info about a specific file, mention it.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: 'user', parts: [{ text: query }] }],
    config: {
      systemInstruction
    }
  });

  return response.text;
}
