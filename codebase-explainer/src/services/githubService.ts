import { Octokit } from 'octokit';

const octokit = new Octokit();

export interface RepoNode {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  url: string;
}

export interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

export interface RepoStructure {
  owner: string;
  repo: string;
  tree: RepoNode[];
  languages: Record<string, number>;
  readme?: string;
  packageJson?: any;
  contributors?: Contributor[];
}

export async function fetchRepoData(url: string): Promise<RepoStructure> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, repo] = match;

  // Fetch basic repo info
  const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo });
  
  // Fetch languages
  const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });

  // Fetch contributors
  let contributors: Contributor[] = [];
  try {
    const { data } = await octokit.rest.repos.listContributors({ owner, repo, per_page: 5 });
    contributors = data.map(c => ({
      login: c.login!,
      avatar_url: c.avatar_url,
      contributions: c.contributions
    }));
  } catch (e) {
    console.error("Failed to fetch contributors", e);
  }

  // Fetch full tree
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: repoInfo.default_branch,
    recursive: 'true',
  });

  // Try to find README and package.json
  const readmeNode = treeData.tree.find(n => n.path?.toLowerCase() === 'readme.md');
  const packageJsonNode = treeData.tree.find(n => n.path === 'package.json');

  let readme = '';
  if (readmeNode) {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: readmeNode.path! });
    if (!Array.isArray(data) && 'content' in data) {
      readme = decodeGitHubContent(data.content);
    }
  }

  let packageJson = null;
  if (packageJsonNode) {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: packageJsonNode.path! });
    if (!Array.isArray(data) && 'content' in data) {
      packageJson = JSON.parse(decodeGitHubContent(data.content));
    }
  }

  return {
    owner,
    repo,
    tree: treeData.tree as RepoNode[],
    languages,
    readme,
    packageJson,
    contributors,
  };
}

function decodeGitHubContent(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export async function getFileContent(owner: string, repo: string, path: string): Promise<string> {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
  if (!Array.isArray(data) && 'content' in data) {
    return decodeGitHubContent(data.content);
  }
  return '';
}
