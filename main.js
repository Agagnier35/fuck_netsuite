const puppeteer = require("puppeteer");
const yargs = require("yargs");

(async () => {
  const argv = yargs
    .option("username", {
      alias: "u",
      description: "Username for login",
      type: "string",
    })
    .option("password", {
      alias: "p",
      description: "Password for login",
      type: "string",
    })
    .option("days", {
      alias: "n",
      description: "Number of days to submit",
      type: "number",
      default: 1,
    })
    .option("browser", {
      alias: "b",
      description: "Should open the browser or run in background",
      type: "boolean",
    })
    .option("dryRun", {
      alias: "d",
      description: "Won't submit any time, used as testing purposes",
      type: "boolean",
    })
    .demandOption(["username", "password"])
    .help()
    .alias("help", "h").argv;

  if (!argv.username) {
    console.log("Missing username");
    return;
  }
  if (!argv.password) {
    console.log("Missing password");
    return;
  }

  try {
    const browser = await puppeteer.launch({ headless: !argv.browser });
    const page = await browser.newPage();

    await page.authenticate({
      username: argv.username,
      password: argv.password,
    });

    await page.goto(
      "https://adfs.equisoft.com/adfs/ls/idpinitiatedsignon.aspx?loginToRp=http://www.netsuite.com/sp"
    );

    // redirects console.logs to the node console
    page.on("console", (msg) => {
      for (let i = 0; i < msg._args.length; ++i)
        console.log(`${i}: ${msg._args[i]}`);
    });

    for (let day = 0; day < argv.days; day++) {
      // Extract the current page date
      const dateSelector = "#equ_divDateNav";
      await page.waitForSelector(dateSelector);
      const dayElement = await page.$(dateSelector);
      const day = await page.evaluate((element) => {
        const removeExtrasFromDate = (ele) => {
          for (let i = 0; i < ele.childNodes.length; i++) {
            if (ele.childNodes[i].nodeType != 3)
              //not TEXT_NODE
              ele.removeChild(ele.childNodes[i--]);
          }
          return ele;
        };

        return removeExtrasFromDate(element).textContent.trim();
      }, dayElement);

      // Confirm on any dialog (duplicate creates one)
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });

      // Duplicate last entry
      const duplicateSelector = "#equ_copyPreviousDay";
      await page.click(duplicateSelector);

      // Extract data before submit
      await page.waitForNavigation();
      const hourSelector = "#equ_hours_-100";
      const hourElement = await page.$(hourSelector);
      const hour = await page.evaluate((ele) => ele.value, hourElement);
      const commentSelector = "#equ_comment_-100";
      const commentElement = await page.$(commentSelector);
      const comment = await page.evaluate((ele) => ele.value, commentElement);

      // submit
      const submitSelector = "#equ_submitDay";
      if (!argv.dryRun) {
        await page.click(submitSelector);
        await page.waitForNavigation();
      } else {
        console.log("Dry-run, won't submit");
      }
      console.log(`Submitted day ${day}: ${hour} => ${comment}`);

      // wait for reload then go to next day
      const nextDaySelector = "img.equ_styleMouse[title='Go to next day']";
      await page.waitForSelector(nextDaySelector);
      await page.click(nextDaySelector);
    }

    console.log("All days submitted, exiting");
    await browser.close();
  } catch (e) {}
})();
