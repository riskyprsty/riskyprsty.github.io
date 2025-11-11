document.addEventListener("DOMContentLoaded", () => {
  anchors.add("article h1");

  let ligthbox;
  const imgAnchor = document.getElementsByClassName("glightbox");
  const img = document.querySelectorAll("article img");

  if (img.length != 0) {
    img.forEach((el) => {
      const anchorWrapper = document.createElement("a");

      anchorWrapper.setAttribute("href", el.currentSrc);
      anchorWrapper.setAttribute("class", "glightbox");

      anchorWrapper.appendChild(el.cloneNode(true));

      el.parentNode.replaceChild(anchorWrapper, el);
    });
  }

  if (imgAnchor.length != 0) {
    ligthbox = GLightbox();
  }
});
