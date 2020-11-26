# PanElixir - Auto-Update Google Division
> This package uses bs4 to scrape data from Google News about Vaccines and adds it to news database

> Data source: [Google News](https://www.google.com/search?tbm=nws&q=vaccine+news&oq=vaccine+news)

## **Divisions and Internal Links**
+ ### [Main Project - Master Branch](https://github.com/tonyliunyc/panelixir/tree/master)
+ ### [Auto-Update NYTimes Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateNYTimes)


## Version History
- v1.0 - Initial release
    + Released: November 26, 2020

## Description
- This program uses python to update 'General Vaccine News'
    - Get data from Google News using keywords 'Vaccine News'
    - Get data from existing database news in 'G' category
    - Update the news database if not duplicates
   

## Run Frequency
- This program runs every 4 hours
- cron expression: `0 */4 * * *`

## Project Structure
```
├── AutoUpdate.py
├── bs4
├── soupsieve
├── certifi
├── chardet
├── requests
├── psycopg2
├── idna
├── urllib3
├── function.zip
├── return.json
├── .gitignore
├── README.md
```

## Run Script Using Terminal
1. Schedule cron job in terminal
    + `crontab -e`
2. Enter run frequency + /path/to/file
    + `0 */4 * * * ~/Desktop/google_news_update/AutoUpdate.py`
3. Cron Job should now run at scheduled times. For logs, check 'mail'
4. If permission denied, try:
    + `chmod +x ~/Desktop/google_news_update/`
4. For 'Operation Time Out' and other related issues, check 'Cron Job Tutorial' in Related Resources

## Related Resources
1. [Cron Job Tutorial](https://www.jcchouinard.com/python-automation-with-cron-on-mac/)
