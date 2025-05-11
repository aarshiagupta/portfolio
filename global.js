console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
const BASE_PATH = location.hostname.includes("localhost") || location.hostname.includes("127.0.0.1")
  ? "/"
  : "/portfolio/";

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "Resume" },
  { url: "contact/", title: "Contact" },
  { url: "meta", title: "Meta" },
  { url: "https://github.com/aarshiagupta", title: "GitHub" }
];

let nav = document.querySelector("nav");
if (nav) {
  for (let p of pages) {
    let url = p.url;
    if (!url.startsWith("http")) {
      url = BASE_PATH + url;
    }

    let a = document.createElement("a");
    a.href = url;
    a.textContent = p.title;

    a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);

    a.toggleAttribute("target", a.host !== location.host);

    nav.append(a);
  }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
);

let select = document.querySelector('.color-scheme select');

function setColorScheme(value) {
    document.documentElement.style.setProperty("color-scheme", value);
    select.value = value;
    localStorage.colorScheme = value;
}

select.addEventListener("input", (e) => setColorScheme(e.target.value));

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

let form = document.querySelector("#contact-form");

form?.addEventListener("submit", function (event) {
  event.preventDefault();

  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }

  let mailto = form.action + "?" + params.join("&");
  location.href = mailto;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log(response); 
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function fetchGitHubData(username) {
  
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export function renderProjects(projects, container, headingLevel = 'h2') {
  container.innerHTML = '';
  projects.forEach(p => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${p.title}</${headingLevel}>
      <img src="${p.image}" alt="Image for ${p.title}">
      <div class="project-meta">
        <p>${p.description}</p>
        <p class="project-year">© ${p.year}</p>
      </div>
    `;
    container.appendChild(article);
  });
}