(() => {
  const page = document.querySelector(".concept-page");

  if (!page) {
    return;
  }

  page.addEventListener("pointermove", (event) => {
    const x = event.clientX / Math.max(window.innerWidth, 1);
    const y = event.clientY / Math.max(window.innerHeight, 1);
    page.style.setProperty("--pointer-x", x.toFixed(3));
    page.style.setProperty("--pointer-y", y.toFixed(3));
  });

  document.querySelectorAll(".flow-node").forEach((node, index, nodes) => {
    node.addEventListener("mouseenter", () => {
      nodes.forEach((item) => item.classList.remove("active"));
      node.classList.add("active");
    });
  });
})();
