const THEME_KEY = "theme";

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);

    if (stored === "light" || stored === "dark") {
        return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    const icon = document.querySelector("#themeToggle i");

    if (icon) {
        icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
    }
}

function setActiveNavLink() {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".nav-link").forEach((link) => {
        const linkPath = new URL(link.getAttribute("href"), window.location.origin).pathname;

        const isActive = linkPath === "/"
            ? currentPath === "/"
            : currentPath === linkPath || currentPath.startsWith(linkPath);

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function setupScrollReveal() {
    const items = document.querySelectorAll(".reveal");

    if (!items.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
        return;
    }

    // Elements only start out hidden once we commit to revealing them —
    // avoids content staying invisible if the observer never fires.
    document.documentElement.setAttribute("data-reveal", "");

    const revealAll = () => items.forEach((item) => item.classList.add("is-visible"));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach((item) => observer.observe(item));

    window.setTimeout(revealAll, 3000);
}

async function loadComponent(id, path) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    try {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to load component: ${path}`);
        }

        element.innerHTML = await response.text();

        if (id === "header") {
            applyTheme(getPreferredTheme());
            setActiveNavLink();
        }
    } catch (error) {
        console.error(error);
    }
}

applyTheme(getPreferredTheme());

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(getPreferredTheme());
    }
});

// Same approach as Bootstrap's collapse plugin: while .collapsing is set,
// the CSS transitions the real height between 0 and the menu's
// scrollHeight; afterwards the fixed height is dropped again.
function runCollapse(menu, show) {
    if (!show) {
        menu.style.height = `${menu.offsetHeight}px`;
    }

    menu.classList.remove("collapse", "show");
    menu.classList.add("collapsing");
    menu.offsetHeight; // force a reflow so the transition starts from here

    menu.style.height = show ? `${menu.scrollHeight}px` : "";

    // The duration comes from the CSS, so reduced motion is respected too.
    const duration = parseFloat(getComputedStyle(menu).transitionDuration) * 1000;

    window.setTimeout(() => {
        menu.classList.remove("collapsing");
        menu.classList.add("collapse");
        menu.classList.toggle("show", show);
        menu.style.height = "";
    }, duration);
}

function toggleNav(button) {
    const menu = document.getElementById(button.getAttribute("aria-controls"));

    if (!menu || menu.classList.contains("collapsing")) {
        return;
    }

    const show = !menu.classList.contains("show");

    button.setAttribute("aria-expanded", String(show));
    runCollapse(menu, show);
}

document.addEventListener("click", (event) => {
    const navToggle = event.target.closest("#navToggle");

    if (navToggle) {
        toggleNav(navToggle);
        return;
    }

    const toggle = event.target.closest("#themeToggle");

    if (!toggle) {
        return;
    }

    const next = document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";

    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
});

document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header", "/components/header.html");
    loadComponent("footer", "/components/footer.html");
    setupScrollReveal();
});
