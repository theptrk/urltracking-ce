import "./style.css";

// Function to retrieve recent URLs from localStorage
async function getRecentUrls() {
  let { recent_urls = [] } = await chrome.storage.local.get("recent_urls");
  return recent_urls;
}

// Function to display recent URLs in the popup
async function displayRecentUrls() {
  const recentUrls = await getRecentUrls();
  const urlList = recentUrls
    .map(
      (url_obj) =>
        `<li>
          <a href="${url_obj.url}" target="_blank">
            ${url_obj.title}
          </a>
          <br />
          ${url_obj.method}: (${url_obj.timestamp})
        </li>`
    )
    .join("");

  console.log(urlList);

  document.querySelector("#app").innerHTML = `
    <h1>Hello Vite!</h1>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
    <h2>Recent URLs:</h2>
    <ul>${urlList}</ul>
  `;
}

// Call the function to display recent URLs
displayRecentUrls();
