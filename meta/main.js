import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let timeScale;
let filteredCommits = [];
let commits = [];
let data = [];


async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/aarshiagupta/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: true,
        configurable: true,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
    const container = d3.select('#stats');
    container.html('');
  
    const statsBox = container.append('dl')
      .attr('class', 'stats-grid');
  
    const items = [
      { label: 'COMMITS', value: commits.length },
      { label: 'FILES', value: d3.groups(data, d => d.file).length },
      { label: 'TOTAL LOC', value: data.length },
      { label: 'MAX DEPTH', value: d3.max(data, d => d.depth) },
      { label: 'LONGEST LINE', value: d3.max(data, d => d.length) },
      {
        label: 'MAX LINES IN A FILE',
        value: d3.max(
          d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
          d => d[1]
        )
      }
    ];
  
    for (const { label, value } of items) {
      statsBox.append('dt').text(label);
      statsBox.append('dd').text(value);
    }
  }
  
  

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  window.rScale = d3.scaleSqrt()
  .domain(d3.extent(commits, d => d.totalLines))
  .range([6, 40]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') 
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale)
      .tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  const sortedCommits = commits.toSorted((a, b) => b.totalLines - a.totalLines);

  const dots = svg.append('g').attr('class', 'dots');

  const circles = dots
  .selectAll('circle')
  .data(sortedCommits, d => d.id);

circles
  .join(
    enter => enter.append('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      }),
    update => update
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines)),
    exit => exit.remove()
  );

    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');


  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(d3.axisBottom(xScale));

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (a, b) => b.totalLines - a.totalLines);

  const circles = dots
    .selectAll('circle')
    .data(sortedCommits, d => d.id);

  circles.join(
    enter => enter.append('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      }),
    update => update
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines)),
    exit => exit.remove()
  );
}

async function main() {
  data = await loadData();
  commits = processCommits(data);
  commits = commits.sort((a, b) => a.datetime - b.datetime);

  filteredCommits = commits;

  timeScale = d3.scaleTime(
    [d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)],
    [0, 100]
  );

  renderCommitInfo(data, filteredCommits);
  renderScatterPlot(data, filteredCommits);
  renderFiles(commits);
  onTimeSliderChange();

  d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits.toSorted((a, b) => a.datetime - b.datetime)) 
  .join('div')
  .attr('class', 'step')
  .html((d, i) => `
    <p>
      On ${d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
      })}<br>
      I made <a href="${d.url}" target="_blank">
        ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
      </a><br>
      I edited ${d.totalLines} lines across ${
        d3.rollups(
          d.lines,
          D => D.length,
          d => d.file
        ).length
      } files.<br>
      Then I looked over all I had made, and I saw that it was very good.
    </p>
  `);
  console.log('Step divs added:', commits.length);

  d3.select('#commit-progress').on('input', onTimeSliderChange);

  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scrolly-1 .step',
      offset: 0.5,
    })
    .onStepEnter(onStepEnter);

  d3.select('#commit-progress').on('input', onTimeSliderChange);
}

main();


function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (!commit) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime.toLocaleTimeString('en');
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
  } 

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  document.getElementById('selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');
  container.innerHTML = '';

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  for (const [lang, count] of breakdown) {
    const percent = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `
  <div class="stat-item">
    <div class="stat-label">${lang}</div>
    <div class="stat-value">${count} lines (${percent})</div>
  </div>
`;
  }
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function renderFiles(commits) {
  let lines = commits.flatMap(d => d.lines);
  let files = d3
  .groups(lines, d => d.file)
  .map(([name, lines]) => ({ name, lines }))
  .sort((a, b) => b.lines.length - a.lines.length);

  files.sort((a, b) => b.lines.length - a.lines.length);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const container = d3.select('#files');
  const fileDivs = container.selectAll('div')
    .data(files, d => d.name)
    .join(
      enter => {
        const div = enter.append('div');
        div.append('dt').append('code');
        div.append('dd');
        return div;
      }
    );

  fileDivs.select('dt').each(function(d) {
    const dt = d3.select(this);
    dt.select('code').text(d.name);
  
    if (dt.select('small').empty()) {
      dt.append('small')
        .text(`${d.lines.length} lines`)
        .style('margin-left', '0.5rem')
        .style('color', '#666')
        .style('font-size', '0.75rem');
    }
  });
  
  fileDivs.select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', d => `--color: ${colors(d.type)}`);
}

function onTimeSliderChange() {
  console.log("Slider handler running...");

  const commitProgress = +d3.select('#commit-progress').property('value');
  const commitMaxTime = timeScale.invert(commitProgress);

  console.log("commitMaxTime = ", commitMaxTime.toLocaleString());

  const selectedTime = d3.select('#slider-time');
  if (!selectedTime.empty()) {
    selectedTime.text(commitMaxTime.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short"
    }));
  }

  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);
  renderFiles(filteredCommits);
}

function onStepEnter(response) {
  console.log("STEP", response.index, commits[response.index].datetime);
  const index = response.index;
  const upToCommit = commits[index];

  filteredCommits = commits.slice(0, index + 1);

  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);
  renderFiles(filteredCommits);

  const progress = timeScale(upToCommit.datetime);
  d3.select('#commit-progress').property('value', progress);

  d3.select('#slider-time').text(upToCommit.datetime.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short"
  }));
}
