// chromium   --remote-debugging-port=9222 --user-data-dir=cuser/
// sudo tailscale funnel 3000
import { chromium } from "playwright";
import express from "express";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const defaultContext = await browser.contexts()[0];
const page = defaultContext.pages()[0];

async function searchItem(body) {
  // enter req.request.item.name into input id="twotabsearchtextbox"
  await page.goto( "https://www.amazon.com/alm/storefront?almBrandId=VUZHIFdob2xlIEZvb2Rz");
  await page.fill('input[id="twotabsearchtextbox"]', body.item.name);
  await page.click('input[id="nav-search-submit-button"]');
  await page.waitForLoadState();

  const results = await page.evaluateHandle(() => {
    const searchResults = document.querySelectorAll(
      'div[data-component-type="s-search-result"]'
    );
    const resultArray = Array.from(searchResults).map((div) => {
      const combinedText = `${
        div.querySelector('div[data-cy="title-recipe"]').innerText
      }\n${
        div
          .querySelector('div[data-cy="price-recipe"]')
          ?.innerText?.split("\n")?.[0]
      }`;

      return {
        source: div, // Original div DOM node
        text: combinedText, // Combined text content
      };
    });
    return resultArray;
  });

  return results
}

async function orderItem(items, i, quantity) {
    await page.evaluate(async ([items, i]) => {
        console.log(items, i)
        console.log(items[i].source, "h2 a")
        items[i].source.querySelector("h2 a").click();
    }, [items, i]);
    await page.waitForLoadState();
    await page.click('button[aria-label*="quantity"]');

    console.log("Choosing quantity")
    // click item with class qs-widget-dropdown-link whose innerText regex-matches the input quantity
    const qButton = await page.locator('.qs-widget-dropdown-item', { hasText: new RegExp(`^${quantity}.*`)}).first();
    await new Promise(r => setTimeout(r, 100));
    qButton.click();
    console.log("Chose quantity")
    await page.click("#freshAddToCartButton input");
    console.log("Added to cart")
}

// Express web server to receive POSTed request json
const app = express();
const port = 3000;
const requestCache = { }
app.use(express.json());
app.post("/request", async (req, res) => {
  let body = JSON.parse(JSON.stringify(req.body.request));

  if (!body.requestId) {
    body.requestId = Math.random().toString(36).substring(7);
    requestCache[body.requestId] = body;
    const items = await searchItem(body);
    const itemsJson = await items.jsonValue();
    body.items = items;
    body.itemsJson = itemsJson;

    return res.json({
        "status": "searched-for-item",
        "requestId": body.requestId,
        "choices": itemsJson.map((item, i) => ({itemId: i, item: item.text}))
    })
  }  else {
        const  prev = requestCache[body.requestId];
        const {items, itemsJson} = prev;
        const item = itemsJson[body.selectItemId];
        try {
            await orderItem(items, body.selectItemId, body.selectItemQuantity);
            return res.json({ status: "added-to-cart", item: itemsJson[body.selectItemId].text, quantity: body.selectItemQuantity });
        } catch {
            return res.json({ status: "failed-to-add", details: "Please begin again with a new search for your item."});
        }
    }
  }
);

app.listen(port, () => {
  console.log(`Shopping app listening at http://localhost:${port}`);
});