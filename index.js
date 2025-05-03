import {
    fetchJSON,
    renderProjects,
    fetchGitHubData
  } from './global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

  
  (async function() {
    const projects = await fetchJSON('./lib/projects.json');
    const latest = projects.slice(0, 3);
    const projContainer = document.querySelector('.projects');
    renderProjects(latest, projContainer, 'h2');
  
    const githubData = await fetchGitHubData('aarshiagupta');

  const profileStats = document.querySelector('#profile-stats');

  if (profileStats) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
})();
  

