I can't be arsed to enter hours in NetSuite every day, so here's a JS script that does it for me.
It uses the duplicate button, so make sure your last entry is valid

Requires Node.js, at least LTS

HOW_TO USE:

- On your first usage ever: `npm i`

1. `node main.js -u username -p password`

That's it.

You can use `-h` to see all the options like dryRun or numbers of day to submit.

Also if you are a true power user, since it's a simple command line, you could probably set-up a CRON job that automatically runs every Monday and submits 5 days, and never worry about this shit ever again
