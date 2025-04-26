import { fetchJSON, renderProjects } from '../global.js';

(async function() {
  const projects = await fetchJSON('../lib/projects.json');

  const titleElem = document.querySelector('.projects-title');
  const count = projects.length;
  titleElem.textContent = `${count} Projects`;

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');
})();
