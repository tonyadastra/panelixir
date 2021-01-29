# PanElixir - Auto-Update SF Bay Area News  Division
> This package uses AWS Lambda Function to collect vaccination news from NewsAPI and append to database local_vaccinations

> Data source: NewsAPI

## **Divisions and Internal Links**
+ ### [Main Project - Master Branch](https://github.com/tonyliunyc/panelixir/tree/master)
    + ### [Auto-Update NYTimes Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateNYTimes)
    + ### [Auto-Update Google Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateGoogle)
    + ### [Auto-Update World Vaccinations Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateWorldVaccinations)

## Version History
- v1.0 - Initial release 
    + Released: January 28, 2021

## The Lambda Function
- This program is a lambda function that obtains the latest news for vaccination in SF Bay Area from newsAPI and updates database local_vaccinations


## Run Frequency
- This program runs every day at 0:00 under AWS EventBridge (CloudWatch Events)
- cron expression: `0 * * * ? *`
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
├── newsSFBayArea.py
├── function.zip
├── return.json
├── .gitignore
├── README.md
```

## Update AWS Lambda Function using Terminal

[comment]: <> (1. Install awscli using pip )

[comment]: <> (    + `pip install awscli`)

[comment]: <> (2. Login to AWS in terminal. The access key ID and password can be found in AWS Credentials. For default region, use us-west-1)

[comment]: <> (    + `aws configure`)

[comment]: <> (3. Add additional packages to the package folder if necessary. If no new packages are added, skip to step 7.)

[comment]: <> (    + `pip install --target ./package [new-package]`)
4. Go to the package directory
    + `cd package`
5. Zip the package folder (`$OLDPWD` stands for OLDPrintWorkingDirectory, which corresponds to the directory before the `cd` command)
    + `zip -r9 ${OLDPWD}/function.zip .`
6. Return to the main directory
    + `cd $OLDPWD`
7. Zip all necessary files to upload to AWS Lambda. Remember to include new files here if necessary
    + `zip -g function.zip newsSFBayArea.py models/ -r`
8. Send updates to AWS Lambda
    + `aws lambda update-function-code --function-name newsSFBayArea --zip-file fileb://function.zip`
9. If successful, a JSON with `"LastUpdateStatus": "Successful"` should be returned.


## Invoke the Lambda Function in Terminal
+ `aws lambda invoke --function-name newsSFBayArea return.json --log-type Tail --query 'LogResult' --output text |  base64 -d`
+ Execution results will be saved to a file called return.json


## Related Resources
1. [NewsAPI](https://newsapi.org/)
3. [AWS Lambda Deployment Package](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html)
4. [Psycopg2 Package for AWS Lambda](https://github.com/jkehler/awslambda-psycopg2) (Note: Directly downloading this package using `pip` would cause an error in deployment)
5. [Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)
6. [AWS Lambda Function Handler](https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html)
