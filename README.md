# PanElixir - Auto-Update NYTimes Division
> This package uses AWS Lambda Function to scrape data from NYTimes Vaccine Tracker Website and modify the news table in the AWS database

> Data source: [The New York Times Vaccine Tracker](https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html)

## **Divisions and Internal Links**
+ ### [Main Project - Master Branch](https://github.com/tonyliunyc/panelixir/tree/master)
+ ### [Auto-Update Google Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateGoogle)

## Version History
- v2.7.7 - Fix delete index error
  + Released: January 27, 2021
- v2.7.6 - Fix "Sinovac" Mismatch, E.U. -> European Union
  + Released: January 7, 2021
- v2.7.5 - Fix Oxford-AstraZeneca not found, Fix New Year changing prev. December also to new year
    + Released: January 3, 2021
- v2.7.4 - Fix 'other countries' replacing original
    + Released: December 30, 2020
- v2.7.3 - Fix matching errors
    + Released: December 25, 2020
- v2.7.2 - Update algorithm for NYTimes Update
    + Released: December 16, 2020
- v2.7.1 - Update similarity requirement to update news, optimize process to update approved and limited countries
    + Released: December 12, 2020
- v2.7.0 - Upgrade algorithm to auto_update limited and approved countries
    + Released: December 11, 2020
- v2.6.1 - Update algorithm to fit new NYTimes Tracker version
    + Released: December 11, 2020
- v2.6.0 - Add a new category abandoned to nytimes and intro, include auto_update, fix existing issues with finding vaccines
    + Released: December 10, 2020
- v2.5.0 - Add new categories: candidate, efficacy, dose, injection_type, storage to table, include auto_update
    + Released: December 9, 2020
- v2.4.8 - Update format to be compatible with new NYTimes format with 'name', 'storage', etc
    + Released: December 9, 2020
- v2.4.7 - Fix messaging duplicates and add source 'The New York Times' to database
    + Released: December 8, 2020
- v2.4.6 - Check similarity score(compare existing and new sentence) - if score > 0.95, abort the update
    + Released: December 4, 2020
- v2.4.5 - Add \<b\> and \</b\> tags before and after (respectively) the company names of new vaccines from NYTimes website
    + Released: December 2, 2020
- v2.4.4 - Fix bugs that clogs update in News table, add constraint hasNumbers to be in latest news, otherwise, add to intro
    + Released: December 2, 2020
- v2.4.3 - Add category 'S' to NEWS to be compatible with Google News Update, add platform for new NYTimes vaccines
    + Released: November 30, 2020
- v2.4.2 - Optimize algorithm to handle duplicate updates, update latest news when current month in new updates. Fix bugs that causes the program to return error
    + Released: November 24, 2020
- v2.4.1 - Update algorithm to handle duplicate updates(only update latest news if new updates are not in latest news), add update message
    + Released: November 20, 2020
- v2.4.0 - Update Runtime Frequency to 8~20 EST, update breaking news keywords, update phase_3_start_date in INFO if applicable
    + Released: November 20, 2020
- v2.3.2 - Add keywords to combine and split, optimize update date algorithm 
    + Released: November 19, 2020
- v2.3.1 - Optimize algorithm to update date more accurately, and new keywords to 'Breaking News' 
    + Released: November 18, 2020
- v2.3.0 - Upgrade algorithm to find the vaccine platform from NYTimes website 
    + Released: November 17, 2020
- v2.2.0 - Add new keyword 'early approval' for 'Breaking News' and (find <br>s) update intro format
    + Released: November 16, 2020
- v2.1.1 - Update the format of new updates in intro using a new function 
    + Released: November 16, 2020
- v2.1.0 - Fix the problem that the order of the vaccine causes the program to mismatch the vaccine information 
    + Released: November 16, 2020
- v2.0 - Introduce Auto-Update vaccine intro, date, stage, and others based on NYTimes data
    + Released: November 15, 2020
- v1.3 - Optimize VaccineID Algorithm and simultaneously update INFO if latest news updates stage
    + Released: November 12, 2020
- v1.2 - Update Algorithm to find vaccine_id of Latest News 
    + Released: October 26, 2020
- v1.1 - Switch to html.parser, fix bugs that caused an empty response 
    + Released: October 20, 2020
- v1.0 - Initial release 
    + Released: October 18, 2020

## The Lambda Function
- This program is a lambda function that updates the Latest News Section
    - Checks Latest News date - if over three days, it will remove the "New" tag
    - Scrapes NYTimes Vaccine Tracker News Section
    - Get data from existing database news_nytimes
    - Drop and modify news_nytimes database
    - Compares existing database and new scraped data
    - Update the news database if there are updates
    - Update INFO table if the newly scraped news indicate moving to a new stage
    
- This program also updates the Vaccine Introductions Section
    - Scrapes NYTimes Vaccine Tracker Vaccine Intro Section
    - Get data from existing database nytimes
    - Compares existing database and new scraped data
    - Modify nytimes database if updates are present
    - Update the info database - columns(intro, stage, vac_type, date, early_approval, combined_phases, paused) if there are updates
    - If the new updates on NYTimes is not in INFO table, insert the new vaccine information to INFO and COMPANIES
    - To turn off auto-update: Set all values of allow_auto_update in info to False

## Run Frequency
- This program runs every day at 1:00 and every 2 hours from 13:00-23:00 under AWS EventBridge (CloudWatch Events)
- cron expression: `0 1,13-23/2 * * ? *`
    + Note: The cron expression AWS uses is quite different from the general cron expression. Check out [AWS Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html) for more details

## Project Structure
```
├── models
│   ├── close_match_indexes.py
│   ├── format_nytimes_intro.py
│   └── nytimes_to_panelixir_style.py
├── package
│   ├── requests
│   ├── psycopg2
│   └── bs4
│       ├── BeautifulSoup
├── AutoUpdate.py
├── function.zip
├── return.json
├── .gitignore
├── README.md
```

## Update AWS Lambda Function using Terminal
1. Install awscli using pip 
    + `pip install awscli`
2. Login to AWS in terminal. The access key ID and password can be found in AWS Credentials. For default region, use us-west-1
    + `aws configure`
3. Add additional packages to the package folder if necessary. If no new packages are added, skip to step 7.
    + `pip install --target ./package [new-package]`
4. Go to the package directory
    + `cd package`
5. Zip the package folder (`$OLDPWD` stands for OLDPrintWorkingDirectory, which corresponds to the directory before the `cd` command)
    + `zip -r9 ${OLDPWD}/function.zip .`
6. Return to the main directory
    + `cd $OLDPWD`
7. Zip all necessary files to upload to AWS Lambda. Remember to include new files here if necessary
    + `zip -g function.zip AutoUpdate.py models/ -r`
8. Send updates to AWS Lambda
    + `aws lambda update-function-code --function-name auto_update_nytimes --zip-file fileb://function.zip`
9. If successful, a JSON string should be returned. <br>
Example: 
```
{
    "FunctionName": "auto_update_nytimes",
    "FunctionArn": "arn:aws:lambda:us-west-1:707744075670:function:auto_update_nytimes",
    "Runtime": "python3.8",
    "Role": "arn:aws:iam::707744075670:role/service-role/auto_update_nytimes-role-24k9z0qv",
    "Handler": "AutoUpdate.auto_update_nytimes",
    "CodeSize": 2142681,
    "Description": "",
    "Timeout": 15,
    "MemorySize": 128,
    "LastModified": "2020-11-17T04:49:42.450+0000",
    "CodeSha256": "Ffkj1YzX/iP4S/YZxLSTsttMQVv31hwEz8aVoTCNliY=",
    "Version": "$LATEST",
    "TracingConfig": {
        "Mode": "PassThrough"
    },
    "RevisionId": "b93e2c5a-832f-40de-9f74-98a699b1a580",
    "State": "Active",
    "LastUpdateStatus": "Successful"
}

```

## Invoke the Lambda Function in Terminal
+ `aws lambda invoke --function-name auto_update_nytimes return.json --log-type Tail --query 'LogResult' --output text |  base64 -d`
+ Execution results will be saved to a file called return.json


## Related Resources
1. [AWS Lambda Deployment Package](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html)
2. [Psycopg2 Package for AWS Lambda](https://github.com/jkehler/awslambda-psycopg2) (Note: Directly downloading this package using `pip` would cause an error in deployment)
3. [Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)
4. [AWS Lambda Function Handler](https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html)
