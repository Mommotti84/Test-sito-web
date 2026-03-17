const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".reveal");
const yearNode = document.querySelector("#current-year");
const marketplaceTabs = document.querySelectorAll("[data-tab-target]");
const productCards = document.querySelectorAll(".product-card[data-category][data-product]");
const productButtons = document.querySelectorAll("[data-select-product]");
const orderForm = document.querySelector("[data-telegram-order-form]");
const orderCategory = document.querySelector("#order-category");
const orderProduct = document.querySelector("#order-product");
const orderStatus = document.querySelector("[data-order-status]");
const telegramClubUsername = "Inolemela";

const marketplaceCatalog = Array.from(productCards).reduce((catalog, card) => {
  const category = card.getAttribute("data-category");
  const product = card.getAttribute("data-product");

  if (!category || !product) {
    return catalog;
  }

  if (!catalog[category]) {
    catalog[category] = [];
  }

  if (!catalog[category].includes(product)) {
    catalog[category].push(product);
  }

  return catalog;
}, {});

const populateProductOptions = (category, selectedProduct = "") => {
  if (!orderProduct) {
    return;
  }

  const products = marketplaceCatalog[category] ?? [];
  orderProduct.innerHTML = "";

  products.forEach((product, index) => {
    const option = document.createElement("option");
    option.value = product;
    option.textContent = product;
    option.selected = selectedProduct ? product === selectedProduct : index === 0;
    orderProduct.append(option);
  });
};

const syncOrderCategory = (category, selectedProduct = "") => {
  if (!orderCategory || !category) {
    return;
  }

  orderCategory.value = category;
  populateProductOptions(category, selectedProduct);
};

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (marketplaceTabs.length) {
  const setActiveTab = (nextTab) => {
    const tabList = nextTab.closest("[role='tablist']");

    if (!tabList) {
      return;
    }

    const activeCategory = nextTab.getAttribute("data-category");

    const tabs = tabList.querySelectorAll("[data-tab-target]");

    tabs.forEach((tab) => {
      const targetId = tab.getAttribute("data-tab-target");
      const panel = targetId ? document.getElementById(targetId) : null;
      const isActive = tab === nextTab;

      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      if (panel) {
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      }
    });

    syncOrderCategory(activeCategory ?? "");
  };

  marketplaceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      const tabList = tab.closest("[role='tablist']");

      if (!tabList) {
        return;
      }

      const tabs = Array.from(tabList.querySelectorAll("[data-tab-target]"));
      const currentIndex = tabs.indexOf(tab);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];

      nextTab.focus();
      setActiveTab(nextTab);
    });
  });
}

if (orderCategory) {
  populateProductOptions(orderCategory.value);

  orderCategory.addEventListener("change", () => {
    populateProductOptions(orderCategory.value);
  });
}

if (productButtons.length) {
  productButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");

      if (!card) {
        return;
      }

      const category = card.getAttribute("data-category") ?? "";
      const product = card.getAttribute("data-product") ?? "";
      const matchingTab = Array.from(marketplaceTabs).find(
        (tab) => tab.getAttribute("data-category") === category
      );

      if (matchingTab) {
        matchingTab.click();
      } else {
        syncOrderCategory(category, product);
      }

      if (product) {
        populateProductOptions(category, product);
      }

      if (orderForm) {
        orderForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

if (orderForm) {
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerPhone = String(formData.get("customerPhone") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const product = String(formData.get("product") ?? "").trim();
    const size = String(formData.get("size") ?? "").trim();
    const quantity = String(formData.get("quantity") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const messageLines = [
      "Ciao BMW Club Sardegna, vorrei ordinare un capo dal marketplace.",
      "",
      `Categoria: ${category}`,
      `Capo: ${product}`,
      `Taglia: ${size}`,
      `Quantita: ${quantity}`,
      "",
      `Nome cliente: ${customerName}`,
      `Telefono: ${customerPhone}`
    ];

    if (notes) {
      messageLines.push(`Note: ${notes}`);
    }

    const orderMessage = messageLines.join("\n");
    const telegramUrl = `https://t.me/${telegramClubUsername}`;

    if (orderStatus) {
      orderStatus.textContent = "";
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderMessage);

        if (orderStatus) {
          orderStatus.textContent =
            "Messaggio copiato. Si apre Telegram: ti basta incollare il testo nella chat.";
        }
      } else if (orderStatus) {
        orderStatus.textContent =
          "Telegram si apre ora. Se il testo non viene copiato automaticamente, copialo manualmente dal form.";
      }
    } catch (error) {
      if (orderStatus) {
        orderStatus.textContent =
          "Telegram si apre ora, ma il browser non ha permesso la copia automatica del messaggio.";
      }
    }

    const popup = window.open(telegramUrl, "_blank", "noopener");

    if (!popup) {
      window.location.href = telegramUrl;
    }
  });
}
