import { GoogleGenAI, Type } from "@google/genai";
import { RepoStructure } from "./githubService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Helper to handle AI calls - redirects to proxy on Cloudflare/Production
async function generateContentSafe(prompt: string, config?: any) {
  // If we are in the AI Studio preview environment, use the direct SDK
  // We check for the presence of the API key and that we aren't on a .pages.dev domain
  if (process.env.GEMINI_API_KEY && !window.location.hostname.includes('pages.dev')) {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: config
    });
    return response.text;
  }

  // Otherwise (on Cloudflare or other production hosts), use the secure Function proxy
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, config })
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  
  // Extract text from Gemini response structure (Standard SDK response vs Raw API response)
  // Cloudflare Function returns the raw API response
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

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

  const text = await generateContentSafe(prompt, {
    responseMimeType: "application/json",
    responseSchema: analysisSchema
  });

  return JSON.parse(text || '{}') as CodebaseAnalysis;
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

  return await generateContentSafe(prompt);
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

  return await generateContentSafe(prompt);
}

export interface ComparisonAnalysis {
  scores: {
    category: string;
    repoAScore: number;
    repoBScore: number;
    reasoning: string;
  }[];
  features: {
    feature: string;
    repoAStatus: 'supported' | 'partial' | 'unsupported';
    repoBStatus: 'supported' | 'partial' | 'unsupported';
    details: string;
  }[];
  architecture: {
    title: string;
    repoA: string;
    repoB: string;
  }[];
  scalabilityVerdict: string;
  finalVerdict: {
    winner: 'Repo A' | 'Repo B' | 'Tie';
    summary: string;
    bestFor: string;
  };
  markdownReport: string;
}

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          repoAScore: { type: Type.NUMBER },
          repoBScore: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["category", "repoAScore", "repoBScore", "reasoning"]
      }
    },
    features: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: { type: Type.STRING },
          repoAStatus: { type: Type.STRING, enum: ["supported", "partial", "unsupported"] },
          repoBStatus: { type: Type.STRING, enum: ["supported", "partial", "unsupported"] },
          details: { type: Type.STRING }
        },
        required: ["feature", "repoAStatus", "repoBStatus", "details"]
      }
    },
    architecture: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          repoA: { type: Type.STRING },
          repoB: { type: Type.STRING }
        },
        required: ["title", "repoA", "repoB"]
      }
    },
    scalabilityVerdict: { type: Type.STRING },
    finalVerdict: {
      type: Type.OBJECT,
      properties: {
        winner: { type: Type.STRING, enum: ["Repo A", "Repo B", "Tie"] },
        summary: { type: Type.STRING },
        bestFor: { type: Type.STRING }
      },
      required: ["winner", "summary", "bestFor"]
    },
    markdownReport: { type: Type.STRING, description: "Detailed markdown analysis for deeper reading" }
  },
  required: ["scores", "features", "architecture", "scalabilityVerdict", "finalVerdict", "markdownReport"]
};

export async function compareCodebases(repo1: RepoStructure, repo2: RepoStructure): Promise<ComparisonAnalysis> {
  const prompt = `
    Compare these two GitHub repositories side-by-side:
    
    Repo A: ${repo1.owner}/${repo1.repo}
    Languages A: ${JSON.stringify(repo1.languages)}
    Tech Stack A: ${JSON.stringify(repo1.packageJson?.dependencies || {})}
    
    Repo B: ${repo2.owner}/${repo2.repo}
    Languages B: ${JSON.stringify(repo2.languages)}
    Tech Stack B: ${JSON.stringify(repo2.packageJson?.dependencies || {})}
    
    Provide a detailed comparison focusing on:
    1. Category scores (Code Quality, Documentation, Tech Modernity, Maintenance).
    2. Specific feature support (e.g. "Testing Hub", "CI/CD Readiness", "Dockerized", "Typing Coverage").
    3. Architecture breakdown (Patterns used).
    4. Scalability verdict.
    5. Final verdict on which repo is "better" for specific use cases.
    
    Return a structured JSON response.
  `;

  const text = await generateContentSafe(prompt, {
    responseMimeType: "application/json",
    responseSchema: comparisonSchema
  });

  return JSON.parse(text || '{}') as ComparisonAnalysis;
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

  return await generateContentSafe(
    JSON.stringify([...history, { role: 'user', parts: [{ text: query }] }]),
    { systemInstruction }
  );
}
