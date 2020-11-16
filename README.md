# PanElixir - Auto-Update NYTimes Division
## This package uses AWS Lambda Function to scrape data from NYTimes Vaccine Tracker Website and modify the news table in the AWS database

### Version History
- v2.0 - Introduce Auto-Update vaccine intro, date, stage, and others based on NYTimes data November 15, 2020
- v1.3 - Optimize VaccineID Algorithm and simultaneously update INFO if latest news updates stage November 12, 2020
- v1.2 - Update Algorithm to find vaccine_id of Latest News October 26, 2020
- v1.1 - Switch to html.parser, fix bugs that caused an empty response October 20, 2020
- v1.0 - Initial release October 18, 2020

### The Lambda Function
- This program is a lambda function that updates the Latest News Section
    - Checks Latest News date - if over three days, it will remove the "New" tag
    - Scrapes NYTimes Vaccine Tracker News Section
    - Get data from existing database news_nytimes
    - Drop and modify news_nytimes database
    - Compares existing database and new scraped data
    - Update the news database if there are updates
    
- This program also updates the Vaccine Introductions Section
    - Scrapes NYTimes Vaccine Tracker Intro Section
    - Get data from existing database nytimes
    - Compares existing database and new scraped data
    - Modify nytimes database if updates are present
    - Update the info database - columns(intro, stage, date, early_approval, combined_phases, paused) if there are updates
    - To turn off auto-update: Set all values of allow_auto_update in info to False

### Run Frequency
- This program runs every day at 17:30 and 23:30 UTC under AWS EventBridge (CloudWatch Events)
- cron expression: `30 17,23 * * ? *`

### Project Structure
```
├── package
│   ├── requests
│   ├── psycopg2
│   └── bs4
│       ├── BeautifulSoup
├── lambda_function.py
├── close_match_indexes.py
├── format_nytimes_intro.py
├── function.zip
├── return
├── .gitignore
├── README.md
```

### To Update Lambda Function in AWS using Terminal
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
    + `zip -g function.zip lambda_function.py close_match_indexes.py format_nytimes_intro.py`
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
    "Handler": "lambda_function.lambda_handler",
    "CodeSize": 2140564,
    "Description": "",
    "Timeout": 3,
    "MemorySize": 128,
    "LastModified": "2020-11-15T23:33:06.912+0000",
    "CodeSha256": "LLn5Zbm1UUT9NUlLkgl+HXLGhPH4dx/gyy9420U9gYw=",
    "Version": "$LATEST",
    "TracingConfig": {
        "Mode": "PassThrough"
    },
    "RevisionId": "3fb5003a-7662-492f-bf5d-2816755d2e97",
    "State": "Active",
    "LastUpdateStatus": "Successful"
}
```
### Invoke the Lambda Function in Terminal
+ `aws lambda invoke --function-name auto_update_nytimes return --log-type Tail --query 'LogResult' --output text |  base64 -d`
+ Execution results will be saved to a file called return

### Related Resources
1. [AWS Lambda Deployment Package](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html)
2. [Psycopg2 Package for AWS Lambda](https://github.com/jkehler/awslambda-psycopg2) (Note: Directly downloading this package using `pip` would cause an error in deployment)
3. [Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)

