import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
  if (!projectsGiven || projectsGiven.length === 0) return;

  const svg = d3.select('svg');
  svg.selectAll('path').remove();

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  const pieData = rolledData.map(([year, count]) => ({ label: year, value: count }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const pie = d3.pie().value(d => d.value);
  const arcData = pie(pieData);

  const colors = d3.scaleOrdinal()
    .domain(pieData.map(d => d.label))
    .range(d3.schemeCategory10);

  // Draw wedges
  svg.selectAll('path')
    .data(arcData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', d => colors(d.data.label))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '')
    .on('click', (_, d, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;
  
      svg.selectAll('path')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
  
      legend.selectAll('li')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
  
      const container = document.querySelector('.projects');
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, container, 'h2');
      } else {
        const selectedYear = arcData[selectedIndex].data.label;
        const filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, container, 'h2');
      }
    })
    .on('mouseover', function (_, d) {
      const hoveredYear = d.data.label;
      d3.select(this).attr('opacity', 0.7);
  
      // Highlight corresponding legend item
      legend.selectAll('li')
        .filter(l => l.label === hoveredYear)
        .classed('highlighted', true);
  
      const filtered = projectsGiven.filter(p => p.year === hoveredYear);
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
    })
    .on('mouseout', function (_, d) {
      d3.select(this).attr('opacity', 1);
  
      // Unhighlight legend
      legend.selectAll('li').classed('highlighted', false);
  
      // Restore filtered state (based on selectedIndex)
      const container = document.querySelector('.projects');
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, container, 'h2');
      } else {
        const selectedYear = arcData[selectedIndex].data.label;
        const filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, container, 'h2');
      }
    });

  // Draw legend
  legend.selectAll('li')
    .data(pieData)
    .enter()
    .append('li')
    .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '')
    .attr("style", d => `--color: ${colors(d.label)}`)
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on('click', (_, d, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;
    
      svg.selectAll('path')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
    
      legend.selectAll('li')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
    
      const container = document.querySelector('.projects');
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, container, 'h2');
      } else {
        const selectedYear = pieData[selectedIndex].label;
        const filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, container, 'h2');
      }
    })
    .on('mouseover', function (_, d) {
      // Highlight chart wedge
      svg.selectAll('path')
        .filter(p => p.data.label === d.label)
        .attr('opacity', 0.7);
    
      // Highlight this legend item
      d3.select(this).classed('highlighted', true);
    
      // Filter projects
      const filtered = projectsGiven.filter(p => p.year === d.label);
      renderProjects(filtered, document.querySelector('.projects'), 'h2');
    })
    .on('mouseout', function (_, d) {
      svg.selectAll('path')
        .filter(p => p.data.label === d.label)
        .attr('opacity', 1);
    
      d3.select(this).classed('highlighted', false);
    
      const container = document.querySelector('.projects');
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, container, 'h2');
      } else {
        const selectedYear = pieData[selectedIndex].label;
        const filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, container, 'h2');
      }
    });    
}


let query = '';
const searchInput = document.querySelector('.searchBar');

(async function () {
  const projects = await fetchJSON('../lib/projects.json');

  const titleElem = document.querySelector('.projects-title');
  titleElem.textContent = `${projects.length} Projects`;

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');
  renderPieChart(projects);

  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    const filteredProjects = projects.filter(project => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });
})();
