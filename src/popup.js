import "./style.css";

// Function to retrieve recent URLs from localStorage
async function getRecentUrls() {
  let { recent_urls = [] } = await chrome.storage.local.get("recent_urls");
  return recent_urls;
}

// Function to format timestamp
function formatTimestamp(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

// Function to format raw timestamp with timezone
function formatRawTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

// Function to display recent URLs in the popup
async function displayRecentUrls() {
  const recentUrls = await getRecentUrls();

  const urlList = recentUrls
    .reverse()
    .map(
      (url_obj) =>
        `<li>
          <a href="${url_obj.url}" target="_blank">
            ${url_obj.title}
          </a>

          (${url_obj.domain})
          <br />
          ${url_obj.url}
          <br />

          ${
            url_obj.method
          }: <span class="timestamp" data-raw="${formatRawTimestamp(
          url_obj.timestamp
        )}">${formatTimestamp(url_obj.timestamp)}</span>
        </li>`
    )
    .join("");

  document.querySelector("#app").innerHTML = `
    <h1>Recent URLs</h1>
    <ul>${urlList}</ul>
  `;

  // Add click event listeners to timestamp spans
  document.querySelectorAll(".timestamp").forEach((span) => {
    span.addEventListener("click", function () {
      const rawTimestamp = this.getAttribute("data-raw");
      const formattedTimestamp = this.textContent;
      this.textContent =
        this.textContent === rawTimestamp ? formattedTimestamp : rawTimestamp;
    });
  });
}

// Call the function to display recent URLs
displayRecentUrls();
