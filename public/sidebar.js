const TOOLS = [
  { path: "/timer/", icon: "⏱️", name: "作業タイマー" },
  { path: "/ip-lookup/", icon: "🌐", name: "IPアドレス検索" },
];

function applyStoredTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") {
    document.documentElement.setAttribute("data-theme", stored);
  }
}

function currentEffectiveTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function themeButtonLabel(theme) {
  return theme === "dark" ? "☀️ ライトモード" : "🌙 ダークモード";
}

function renderSidebar() {
  applyStoredTheme();

  const nav = document.createElement("nav");
  nav.className = "sidebar";

  const title = document.createElement("a");
  title.className = "sidebar-title";
  title.href = "/";
  title.textContent = "Dev Tools";
  nav.appendChild(title);

  const list = document.createElement("ul");
  list.className = "tool-list";

  const currentPath = window.location.pathname;

  TOOLS.forEach((tool) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = tool.path;
    a.className = "tool-link";
    if (currentPath === tool.path) {
      a.classList.add("active");
    }
    a.innerHTML = `<span class="tool-icon">${tool.icon}</span><span>${tool.name}</span>`;
    li.appendChild(a);
    list.appendChild(li);
  });

  nav.appendChild(list);

  const themeButton = document.createElement("button");
  themeButton.className = "theme-toggle";
  themeButton.textContent = themeButtonLabel(currentEffectiveTheme());
  themeButton.addEventListener("click", () => {
    const next = currentEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    themeButton.textContent = themeButtonLabel(next);
  });
  nav.appendChild(themeButton);

  document.body.prepend(nav);
}

renderSidebar();
