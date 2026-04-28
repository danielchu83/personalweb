(() => {
  const shareButtons = document.querySelectorAll("[data-share]");

  shareButtons.forEach((button) => {
    const originalLabel = button.textContent;

    button.addEventListener("click", async () => {
      const title = document.title.replace(" | Daniel Chu", "");
      const text = document.querySelector("meta[name='description']")?.content || title;
      const url = window.location.href;

      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          button.textContent = "Link copied";
          window.setTimeout(() => {
            button.textContent = originalLabel;
          }, 1800);
        }
      } catch (error) {
        button.textContent = originalLabel;
      }
    });
  });
})();
